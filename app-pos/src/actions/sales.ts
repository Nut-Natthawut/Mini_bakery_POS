// actions/sales.ts
"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma"; // ✅ ใช้ lib/prisma
import { upsertDailyReport } from "@/actions/report";

type PosItem = { menuID: string; qty: number; price: number };

export type CreateOrderPayload = {
  items: PosItem[];                // 👈 price ตรงนี้เป็น "ราคาหลังลด/ต่อหน่วย" ที่คุณส่งมาจาก UI
  amountPaid: number;
  paymentMethod: "cash" | "qr";
  userID?: string;
  orderDescription?: string;
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

    // ✅ ทำทุกอย่างในทรานแซกชันเดียว
    const { orderID } = await prisma.$transaction(async (tx) => {
      const userID = await resolvePosUserID(tx, maybeUserID);

      // 1) ดึงราคาเดิมของเมนูทั้งหมด
      const menuIDs = Array.from(new Set(items.map(i => i.menuID)));
      const menus = await tx.menu.findMany({
        where: { menuID: { in: menuIDs } },
        select: { menuID: true, price: true },
      });

      const originalPriceMap = new Map<string, Prisma.Decimal>(
        menus.map(m => [m.menuID, m.price as unknown as Prisma.Decimal])
      );

      // 2) อัปเดตราคาเมนูเป็น “ราคาหลังลด” (ตาม payload.items[].price) แบบชั่วคราว
      //    หมายเหตุ: ใช้ Decimal(…) เพื่อความแม่นยำ
      for (const it of items) {
        await tx.menu.update({
          where: { menuID: it.menuID },
          data: { price: new Prisma.Decimal(it.price) },
        });
      }

      // 3) สร้าง order + order_menu
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

      // 4) เรียก Stored Procedure เดิม (SP จะเห็นราคาที่ปรับชั่วคราว)
      await tx.$executeRawUnsafe(`
        CALL create_receipt_for_order('${order.orderID}'::uuid, ${amountPaid}, '${paymentMethod.toUpperCase()}');
      `);

      // 5) กู้คืนราคาเมนูกลับเป็นราคาเดิม
      for (const it of items) {
        const orig = originalPriceMap.get(it.menuID);
        if (orig !== undefined) {
          await tx.menu.update({
            where: { menuID: it.menuID },
            data: { price: orig },
          });
        }
      }

      return { orderID: order.orderID };
    });

    // 6) อ่านใบเสร็จ + อัปเดตรายงาน + revalidate
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
