"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { upsertDailyReport } from "@/actions/report";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function applyMenuDiscount(
  price: number,
  discountType: string | null | undefined,
  discountValue: number | null | undefined,
  defaultPct: number
) {
  const base = Number(price || 0);
  const type = (discountType || "THB").toUpperCase();
  const raw = Number(discountValue || 0);

  let finalUnit = base;

  if (type === "%") {
    const pct = Math.min(Math.max(raw, 0), 100);
    finalUnit = base * (1 - pct / 100);
  } else if (type === "THB") {
    finalUnit = base - Math.max(raw, 0);
  }

  if ((finalUnit === base || finalUnit >= base) && defaultPct > 0) {
    finalUnit = base * (1 - defaultPct / 100);
  }

  return Math.max(0, round2(finalUnit));
}

type PosItem = { menuID: string; qty: number; price: number };

export type CreateOrderPayload = {
  items: PosItem[];
  amountPaid: number;
  paymentMethod: "cash" | "qr";
  userID?: string;
  orderDescription?: string;
};

export type SaleRow = {
  orderID: string;
  orderCode: string;
  seller: string;
  itemsCount: number;
  price: number;
  date: string;
  paymentMethod: "CASH" | "QR";
};

export type BillDetail = {
  orderID: string;
  orderCode: string;
  date: string;
  items: { name: string; qty: number; price: number; total: number }[];
  total: number;
  discount?: number;
  vat?: number;
  change?: number;
};

async function resolvePosUserID(tx: Prisma.TransactionClient, explicit?: string) {
  if (explicit) return explicit;
  const found = await tx.user.findFirst({ where: { username: "pos" }, select: { userID: true } });
  if (found) return found.userID;
  const created = await tx.user.create({
    data: { username: "pos", passwordHash: "!", role: "Staff", fullName: "POS" },
    select: { userID: true },
  });
  return created.userID;
}

export async function createOrderWithReceipt(payload: CreateOrderPayload) {
  try {
    const { items, amountPaid, paymentMethod, userID: maybeUserID, orderDescription } = payload;
    if (!items?.length) return { success: false, error: "ไม่มีรายการสินค้า" };

    const { orderID } = await prisma.$transaction(async (tx) => {
      const userID = await resolvePosUserID(tx, maybeUserID);

      const order = await tx.order.create({
        data: { orderDescription: orderDescription ?? null, orderDateTime: new Date(), userID },
        select: { orderID: true },
      });

      await tx.order_Menu.createMany({
        data: items.map((it) => ({
          orderID: order.orderID,
          menuID: it.menuID,
          quantity: it.qty,
        })),
      });

      await tx.$executeRawUnsafe(`
        CALL create_receipt_for_order('${order.orderID}'::uuid, ${amountPaid}, '${paymentMethod.toUpperCase()}');
      `);

      return { orderID: order.orderID };
    });

    const receipt = await prisma.receipt.findFirst({ where: { orderID } });
    if (!receipt) return { success: false, error: "สร้างใบเสร็จไม่สำเร็จ" };

    await upsertDailyReport(receipt.receiptDate, Number(receipt.grandTotal));
    revalidatePath("/Owner/sale");
    revalidatePath("/Owner/menu");

    return {
      success: true,
      data: {
        orderID,
        receiptID: receipt.receiptID,
        subtotal: Number(receipt.subtotal),
        discountAmount: Number(receipt.discountAmount),
        taxAmount: Number(receipt.taxAmount),
        grandTotal: Number(receipt.grandTotal),
        amountPaid: Number(receipt.amountPaid),
        changeAmount: Number(receipt.changeAmount),
        receiptDate: receipt.receiptDate.toISOString(),
      },
    };
  } catch (e: any) {
    console.error("createOrderWithReceipt error:", e);
    return { success: false, error: e.message || "บันทึกไม่สำเร็จ" };
  }
}

export async function listSales() {
  try {
    const receipts = await prisma.receipt.findMany({
      orderBy: { receiptDate: "desc" },
      include: {
        order: { include: { user: true, orderMenus: true } },
      },
    });

    const rows: SaleRow[] = receipts.map((r) => ({
      orderID: r.orderID,
      orderCode: r.receiptID,
      seller: r.order?.user?.fullName || r.order?.user?.username || "POS",
      itemsCount: r.order?.orderMenus.reduce((s, m) => s + m.quantity, 0) ?? 0,
      price: Number(r.grandTotal),
      date: r.receiptDate.toISOString(),
      paymentMethod: r.paymentMethod as "CASH" | "QR",
    }));

    return { success: true, data: rows };
  } catch (e) {
    console.error("listSales error:", e);
    return { success: false, error: "ไม่สามารถดึงรายการขายได้" };
  }
}

export async function getBillByOrderID(orderID: string) {
  try {
    const config = await prisma.systemConfig.findFirst({ select: { defaultDiscountPct: true } });
    const defaultDiscountPct = Number(config?.defaultDiscountPct ?? 0);

    const order = await prisma.order.findUnique({
      where: { orderID },
      include: {
        receipt: true,
        orderMenus: { include: { menu: true } },
      },
    });
    if (!order?.receipt) return { success: false, error: "ไม่พบบิลที่ต้องการ" };

    const items = order.orderMenus.map((om) => {
      const unitBase = Number(om.menu.price);
      const unitFinal = applyMenuDiscount(
        unitBase,
        (om.menu as any).discountType,
        Number((om.menu as any).discountValue ?? 0),
        defaultDiscountPct
      );

      return {
        name: om.menu.menuName,
        qty: om.quantity,
        price: unitFinal,
        total: round2(unitFinal * om.quantity),
      };
    });

    const data: BillDetail = {
      orderID,
      orderCode: order.receipt.receiptID,
      date: order.receipt.receiptDate.toISOString(),
      items,
      total: Number(order.receipt.grandTotal),
      discount: Number(order.receipt.discountAmount),
      vat: Number(order.receipt.taxAmount),
      change: Number(order.receipt.changeAmount),
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
