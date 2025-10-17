"use server";

import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export type ReportSummary = {
  totalSales: number;       // ผลรวม grandTotal ในช่วงวันที่
  numberOfOrders: number;   // จำนวนบิล/ออเดอร์ในช่วงวันที่
};

/** อัปเดต/เพิ่ม Report รายวันหลังจากขายสำเร็จ */
export async function upsertDailyReport(date: Date, grandTotal: number) {
  // บันทึกแบบ "daily"
  const d = new Date(date);
  const reportDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); // normalize เป็นวัน (UTC)

  // ป้องกัน float
  const money = new Prisma.Decimal(Number(grandTotal).toFixed(2));

  // ถ้ามี record วันนั้นอยู่แล้ว → update + increment, ถ้าไม่มีก็ create
  const exist = await prisma.report.findFirst({
    where: { reportDate: reportDate, reportType: "daily" },
  });

  if (exist) {
    await prisma.report.update({
      where: { reportID: exist.reportID },
      data: {
        totalSales: new Prisma.Decimal(exist.totalSales.toNumber() + money.toNumber()),
        numberOfOrders: exist.numberOfOrders + 1,
      },
    });
  } else {
    await prisma.report.create({
      data: {
        reportDate: reportDate,        // @db.Date
        reportType: "daily",
        totalSales: money,
        numberOfOrders: 1,
      },
    });
  }
}

/** อ่านสรุปรายวันในช่วง [from..to] จากตาราง Report (ชนิด daily) */
export async function getReportSummary(fromISO: string, toISO: string) {
  try {
    // normalize ให้เป็น date-only (UTC)
    const from = new Date(fromISO + "T00:00:00.000Z");
    const to = new Date(toISO + "T00:00:00.000Z");

    const recs = await prisma.report.findMany({
      where: {
        reportType: "daily",
        reportDate: {
          gte: from,
          lte: to,
        },
      },
    });

    const sum: ReportSummary = recs.reduce(
      (acc, r) => {
        acc.totalSales += Number(r.totalSales);
        acc.numberOfOrders += r.numberOfOrders;
        return acc;
      },
      { totalSales: 0, numberOfOrders: 0 }
    );

    return { success: true as const, data: sum };
  } catch (e) {
    console.error("getReportSummary error:", e);
    return { success: false as const, error: "ดึงสรุปรายงานไม่สำเร็จ" };
  }
}
