"use server";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// แถวในตารางใบเสร็จ (หน้า index)
export type ReceiptRow = {
  receiptID: string;
  orderID: string;
  receiptDate: string;                // ISO
  seller: string;                     // ชื่อผู้ขาย
  itemsCount: number;                 // จำนวนชิ้นรวมในออเดอร์
  grandTotal: number;                 // ยอดสุทธิ
  paymentMethod: "CASH" | "QR";
};

// รายละเอียดใบเสร็จ (หน้า detail)
export type ReceiptView = {
  receiptID: string;
  orderID: string;
  date: string;                       // ISO
  seller: string;
  paymentMethod: "CASH" | "QR";
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  changeAmount: number;
  items: { name: string; qty: number; price: number; total: number }[];
};

/** ลิสต์ใบเสร็จทั้งหมด (ล่าสุดก่อน) */
export async function listReceipts(): Promise<{success:boolean; data?:ReceiptRow[]; error?:string}> {
  try {
    const receipts = await prisma.receipt.findMany({
      orderBy: { receiptDate: "desc" },
      include: {
        order: {
          include: {
            user: true,
            orderMenus: true,
          },
        },
      },
    });

    const rows: ReceiptRow[] = receipts.map((r) => ({
      receiptID: r.receiptID,
      orderID: r.orderID,
      receiptDate: r.receiptDate.toISOString(),
      seller: r.order?.user?.fullName || r.order?.user?.username || "POS",
      itemsCount: r.order?.orderMenus.reduce((s, m) => s + m.quantity, 0) ?? 0,
      grandTotal: Number(r.grandTotal),
      paymentMethod: r.paymentMethod,
    }));

    return { success: true, data: rows };
  } catch (e) {
    console.error("listReceipts error:", e);
    return { success:false, error:"ไม่สามารถดึงรายการใบเสร็จได้" };
  }
}

/** ดึงรายละเอียดใบเสร็จตาม receiptID */
export async function getReceiptByID(receiptID: string): Promise<{success:boolean; data?:ReceiptView; error?:string}> {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { receiptID },
      include: {
        order: {
          include: {
            user: true,
            orderMenus: { include: { menu: true } },
          },
        },
      },
    });
    if (!receipt || !receipt.order) return { success:false, error:"ไม่พบใบเสร็จ" };

    const items = receipt.order.orderMenus.map((om) => {
      const price = Number(om.menu.price); // ถ้าต้องการตรึงราคาขณะขาย ให้เก็บ unitPriceAtSale ใน Order_Menu
      const total = price * om.quantity;
      return { name: om.menu.menuName, qty: om.quantity, price, total };
    });

    const data: ReceiptView = {
      receiptID: receipt.receiptID,
      orderID: receipt.orderID,
      date: receipt.receiptDate.toISOString(),
      seller: receipt.order.user?.fullName || receipt.order.user?.username || "POS",
      paymentMethod: receipt.paymentMethod,
      subtotal: Number(receipt.subtotal),
      discountAmount: Number(receipt.discountAmount),
      taxAmount: Number(receipt.taxAmount),
      grandTotal: Number(receipt.grandTotal),
      amountPaid: Number(receipt.amountPaid),
      changeAmount: Number(receipt.changeAmount),
      items,
    };

    return { success:true, data };
  } catch (e) {
    console.error("getReceiptByID error:", e);
    return { success:false, error:"ดึงข้อมูลใบเสร็จไม่สำเร็จ" };
  }
}
