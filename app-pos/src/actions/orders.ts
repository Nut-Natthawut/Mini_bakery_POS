"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** ===== Types ===== */
export type OrderStatus = "PENDING" | "PAID";

export type OrderRow = {
  orderID: string;
  receiptID: string | null; // มีใบเสร็จแล้วจะไม่ null
  orderDateTime: string;    // ISO
  seller: string;           // fullName || username || "-"
  itemsCount: number;       // sum(quantity)
  total: number;            // ถ้า PAID = grandTotal, ถ้า PENDING = subtotal คำนวณจากเมนูปัจจุบัน (ประมาณการ)
  status: OrderStatus;      // PAID=มี receipt, PENDING=ไม่มี receipt
};

export type OrderItemLine = {
  menuID: string;
  name: string;
  qty: number;
  price: number;  // ราคาปัจจุบันของเมนู (ถ้าต้องตรึงราคา ควรเก็บใน Order_Menu ตอนขาย)
  total: number;
};

export type OrderDetail = {
  orderID: string;
  status: OrderStatus;
  orderDateTime: string;
  seller: string;
  items: OrderItemLine[];
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  grandTotal?: number;
  receiptID?: string;
  paymentMethod?: "CASH" | "QR";
  amountPaid?: number;
  changeAmount?: number;
};

/** ===== Utils ===== */
const to2 = (n: number) => Number(n.toFixed(2));

/** ===== List Orders (ทุกสถานะ) =====
 * filters:
 *  from?: string(ISO)
 *  to?: string(ISO)
 *  seller?: string (userID)
 *  status?: "PENDING" | "PAID"
 */
export async function listOrders(filters?: {
  from?: string;
  to?: string;
  seller?: string;
  status?: OrderStatus;
}): Promise<{ success: boolean; data?: OrderRow[]; error?: string }> {
  try {
    const where: any = {};

    // กรองตามช่วงเวลา (orderDateTime)
    if (filters?.from || filters?.to) {
      where.orderDateTime = {};
      if (filters.from) where.orderDateTime.gte = new Date(filters.from);
      if (filters.to) where.orderDateTime.lte = new Date(filters.to);
    }

    // กรองผู้ขาย
    if (filters?.seller) {
      where.userID = filters.seller;
    }

    // ดึงทั้งหมดก่อน (รวม receipt เพื่อง่ายต่อการคำนวณ status)
    const orders = await prisma.order.findMany({
      where,
      orderBy: { orderDateTime: "desc" },
      include: {
        user: true,
        receipt: true,
        orderMenus: {
          include: { menu: true },
        },
      },
    });

    let rows = orders.map<OrderRow>((o) => {
      const itemsCount = o.orderMenus.reduce((s, x) => s + x.quantity, 0);
      const status: OrderStatus = o.receipt ? "PAID" : "PENDING";

      // ถ้า PAID ใช้ยอดจาก Receipt, ถ้า PENDING คิด subtotal ชั่วคราวจากเมนูปัจจุบัน
      const total = o.receipt
        ? Number(o.receipt.grandTotal)
        : o.orderMenus.reduce((s, x) => s + Number(x.menu.price) * x.quantity, 0);

      return {
        orderID: o.orderID,
        receiptID: o.receipt?.receiptID ?? null,
        orderDateTime: o.orderDateTime.toISOString(),
        seller: o.user?.fullName || o.user?.username || "-",
        itemsCount,
        total: to2(total),
        status,
      };
    });

    if (filters?.status) {
      rows = rows.filter((r) => r.status === filters.status);
    }

    return { success: true, data: rows };
  } catch (e) {
    console.error("listOrders error:", e);
    return { success: false, error: "ไม่สามารถดึงรายการออเดอร์ได้" };
  }
}

/** ===== Get Order Detail ===== */
export async function getOrderDetail(orderID: string): Promise<{ success: boolean; data?: OrderDetail; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderID },
      include: {
        user: true,
        receipt: true,
        orderMenus: { include: { menu: true } },
      },
    });

    if (!order) return { success: false, error: "ไม่พบออเดอร์ที่ระบุ" };

    const status: OrderStatus = order.receipt ? "PAID" : "PENDING";
    const items: OrderItemLine[] = order.orderMenus.map((om) => {
      const price = Number(om.menu.price);
      return {
        menuID: om.menuID,
        name: om.menu.menuName,
        qty: om.quantity,
        price: to2(price),
        total: to2(price * om.quantity),
      };
    });

    const subtotal = to2(items.reduce((s, x) => s + x.total, 0));

    const data: OrderDetail = {
      orderID,
      status,
      orderDateTime: order.orderDateTime.toISOString(),
      seller: order.user?.fullName || order.user?.username || "-",
      items,
      subtotal,
    };

    if (order.receipt) {
      data.receiptID = order.receipt.receiptID;
      data.discountAmount = Number(order.receipt.discountAmount);
      data.taxAmount = Number(order.receipt.taxAmount);
      data.grandTotal = Number(order.receipt.grandTotal);
      data.paymentMethod = order.receipt.paymentMethod;
      data.amountPaid = Number(order.receipt.amountPaid);
      data.changeAmount = Number(order.receipt.changeAmount);
    }

    return { success: true, data };
  } catch (e) {
    console.error("getOrderDetail error:", e);
    return { success: false, error: "ไม่สามารถดึงรายละเอียดออเดอร์ได้" };
  }
}

/** ===== Void / Delete Pending Order (ไม่มีใบเสร็จ) ===== */
export async function voidPendingOrder(orderID: string): Promise<{ success: boolean; error?: string }> {
  try {
    const target = await prisma.order.findUnique({
      where: { orderID },
      include: { receipt: true },
    });

    if (!target) return { success: false, error: "ไม่พบออเดอร์" };
    if (target.receipt) return { success: false, error: "ออเดอร์นี้ชำระเงินแล้ว ไม่สามารถยกเลิกได้" };

    await prisma.$transaction([
      prisma.order_Menu.deleteMany({ where: { orderID } }),
      prisma.order.delete({ where: { orderID } }),
    ]);

    revalidatePath("/Owner/orders");
    return { success: true };
  } catch (e) {
    console.error("voidPendingOrder error:", e);
    return { success: false, error: "ยกเลิกออเดอร์ไม่สำเร็จ" };
  }
}
