"use server";

import { PrismaClient, Prisma, PaymentMethod, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

type PosItem = { menuID: string; qty: number; price: number };

export type CreateOrderPayload = {
  items: PosItem[];
  amountPaid: number;
  paymentMethod: "cash" | "qr";
  userID?: string;              // <-- ทำให้เป็น optional
  orderDescription?: string;
};

export type CreateOrderResult = {
  orderID: string;
  receiptID: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  changeAmount: number;
  receiptDate: string;
};

/** ใช้/สร้างผู้ใช้สำหรับ POS อัตโนมัติ เมื่อไม่ได้ส่ง userID */
// ⬅️ แก้ชนิดของ tx ให้ถูกต้อง
async function resolvePosUserID(
  tx: Prisma.TransactionClient,
  explicitUserID?: string
): Promise<string> {
  if (explicitUserID) return explicitUserID;

  const existing = await tx.user.findFirst({
    where: { username: "pos" },
    select: { userID: true },
  });
  if (existing) return existing.userID;

  const created = await tx.user.create({
    data: {
      username: "pos",
      passwordHash: "!",
      role: "Staff",         // หรือ Role.Staff ถ้าคุณ import enum มาแล้ว
      fullName: "POS",
    },
    select: { userID: true },
  });

  return created.userID;
}


export async function createOrderWithReceipt(
  payload: CreateOrderPayload
): Promise<{ success: boolean; data?: CreateOrderResult; error?: string }> {
  try {
    const { items, amountPaid, paymentMethod, userID: maybeUserID, orderDescription } = payload;

    if (!items || items.length === 0) {
      return { success: false, error: "ไม่มีรายการสินค้า" };
    }

    const sys = await prisma.systemConfig.findFirst();
    const taxRatePct = Number(sys?.taxRatePct ?? 0);
    const defaultDiscountPct = Number(sys?.defaultDiscountPct ?? 0);

    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const discountAmount = (subtotal * defaultDiscountPct) / 100;
    const taxable = subtotal - discountAmount;
    const taxAmount = (taxable * taxRatePct) / 100;
    const grandTotal = taxable + taxAmount;
    const changeAmount = amountPaid - grandTotal;

    if (amountPaid < grandTotal) {
      return { success: false, error: "จำนวนเงินที่รับมาน้อยกว่ายอดชำระ" };
    }

    const d = (n: number) => new Prisma.Decimal(Number(n.toFixed(2)));

    const { order, receipt } = await prisma.$transaction(async (tx) => {
      const resolvedUserID = await resolvePosUserID(tx, maybeUserID);

      const order = await tx.order.create({
        data: {
          orderDescription: orderDescription ?? null,
          orderDateTime: new Date(),
          userID: resolvedUserID,
        },
      });

      await tx.order_Menu.createMany({
        data: items.map((it) => ({
          orderID: order.orderID,
          menuID: it.menuID,
          quantity: it.qty,
        })),
      });

      const receipt = await tx.receipt.create({
        data: {
          orderID: order.orderID,
          receiptDate: new Date(),
          subtotal: d(subtotal),
          discountAmount: d(discountAmount),
          taxAmount: d(taxAmount),
          grandTotal: d(grandTotal),
          amountPaid: d(amountPaid),
          changeAmount: d(changeAmount),
          paymentMethod: paymentMethod === "cash" ? PaymentMethod.CASH : PaymentMethod.QR,
        },
      });

      return { order, receipt };
    });

    revalidatePath("/Owner/sale");
    revalidatePath("/Owner/menu");

    return {
      success: true,
      data: {
        orderID: order.orderID,
        receiptID: receipt.receiptID,
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal,
        amountPaid,
        changeAmount,
        receiptDate: receipt.receiptDate.toISOString(),
      },
    };
  } catch (e) {
    console.error("createOrderWithReceipt error:", e);
    return { success: false, error: "บันทึกออร์เดอร์/ใบเสร็จไม่สำเร็จ" };
  }
}

/* ---------- สำหรับหน้า Sales ---------- */
export type SaleRow = {
  orderID: string;
  orderCode: string;
  seller: string;
  itemsCount: number;
  price: number;
  date: string;
};

export async function listSales(): Promise<{ success: boolean; data?: SaleRow[]; error?: string }> {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { orderDateTime: "desc" },
      include: { user: true, receipt: true, orderMenus: true },
    });

    const rows: SaleRow[] = orders
      .filter((o) => o.receipt)
      .map((o) => ({
        orderID: o.orderID,
        orderCode: o.receipt!.receiptID,
        seller: o.user?.fullName || o.user?.username || "-",
        itemsCount: o.orderMenus.reduce((s, m) => s + m.quantity, 0),
        price: Number(o.receipt!.grandTotal),
        date: o.receipt!.receiptDate.toISOString(),
      }));

    return { success: true, data: rows };
  } catch (e) {
    console.error("listSales error:", e);
    return { success: false, error: "ไม่สามารถดึงรายการขายได้" };
  }
}

export type BillDetail = {
  orderID: string;
  orderCode: string;
  date: string;
  items: { name: string; qty: number; price: number; total: number }[];
  total: number;
};

export async function getBillByOrderID(orderID: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderID },
      include: {
        receipt: true,
        orderMenus: { include: { menu: true } },
      },
    });
    if (!order || !order.receipt) return { success: false, error: "ไม่พบบิลที่ต้องการ" };

    const items = order.orderMenus.map((om) => {
      const price = Number(om.menu.price);
      return { name: om.menu.menuName, qty: om.quantity, price, total: price * om.quantity };
    });

    const data: BillDetail = {
      orderID,
      orderCode: order.receipt.receiptID,
      date: order.receipt.receiptDate.toISOString(),
      items,
      total: Number(order.receipt.grandTotal),
    };

    return { success: true, data };
  } catch (e) {
    console.error("getBillByOrderID error:", e);
    return { success: false, error: "ไม่สามารถดึงบิลได้" };
  }
}

export async function deleteSale(orderID: string) {
  try {
    await prisma.$transaction([
      prisma.receipt.deleteMany({ where: { orderID } }),
      prisma.order_Menu.deleteMany({ where: { orderID } }),
      prisma.order.delete({ where: { orderID } }),
    ]);
    revalidatePath("/Owner/sale");
    return { success: true };
  } catch (e) {
    console.error("deleteSale error:", e);
    return { success: false, error: "ไม่สามารถลบรายการขายได้" };
  }
}
