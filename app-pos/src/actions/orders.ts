// src/actions/orders.ts
"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export type OrderRow = {
  orderID: string;
  orderDateTime: string; // ISO
  userID: string;
  userName: string;      // fullName || username
  itemsCount: number;    // จำนวนสินค้าทั้งหมดในออเดอร์ (sum quantity)
};

export type OrderDetail = {
  orderID: string;
  orderDateTime: string; // ISO
  userID: string;
  userName: string;
  description?: string | null;
  items: { menuID: string; name: string; price: number; qty: number; total: number }[];
};

export async function listOrders(): Promise<{ success: boolean; data?: OrderRow[]; error?: string }> {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { orderDateTime: "desc" },
      include: {
        user: true,
        orderMenus: true,
      },
    });

    const rows: OrderRow[] = orders.map((o) => ({
      orderID: o.orderID,
      orderDateTime: o.orderDateTime.toISOString(),
      userID: o.userID,
      userName: o.user?.fullName || o.user?.username || "-",
      itemsCount: o.orderMenus.reduce((s, m) => s + m.quantity, 0),
    }));

    return { success: true, data: rows };
  } catch (e) {
    console.error("listOrders error:", e);
    return { success: false, error: "ไม่สามารถดึงรายการออเดอร์ได้" };
  }
}

export async function getOrderDetail(orderID: string): Promise<{ success: boolean; data?: OrderDetail; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderID },
      include: {
        user: true,
        orderMenus: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "ไม่พบออเดอร์ที่ระบุ" };
    }

    const items = order.orderMenus.map((om) => {
      const price = Number(om.menu.price); // ราคาเมนูปัจจุบัน (ถ้าต้องการ fix ราคาตอนขาย ให้เพิ่มฟิลด์ soldPrice)
      const total = price * om.quantity;
      return {
        menuID: om.menuID,
        name: om.menu.menuName,
        price,
        qty: om.quantity,
        total,
      };
    });

    const data: OrderDetail = {
      orderID: order.orderID,
      orderDateTime: order.orderDateTime.toISOString(),
      userID: order.userID,
      userName: order.user?.fullName || order.user?.username || "-",
      description: order.orderDescription,
      items,
    };

    return { success: true, data };
  } catch (e) {
    console.error("getOrderDetail error:", e);
    return { success: false, error: "ไม่สามารถดึงรายละเอียดออเดอร์ได้" };
  }
}

export async function revalidateOrdersPage() {
  revalidatePath("/Owner/orders");
  return { success: true };
}
