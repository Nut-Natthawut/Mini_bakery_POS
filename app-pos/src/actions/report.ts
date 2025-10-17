"use server";

// UTF-8 clean rewrite
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ReportSummary = {
  totalSales: number;       // sum of grandTotal in range
  numberOfOrders: number;   // number of receipts in range
};

// Upsert daily report record (aligned with DB rollup using reportType = 'DAILY')
export async function upsertDailyReport(date: Date, grandTotal: number) {
  const d = new Date(date);
  const reportDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  const money = new Prisma.Decimal(Number(grandTotal).toFixed(2));

  const exist = await prisma.report.findFirst({
    where: { reportDate: reportDate, reportType: "DAILY" },
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
        reportDate,
        reportType: "DAILY",
        totalSales: money,
        numberOfOrders: 1,
      },
    });
  }
}

// Read daily summary from Report between [from..to] (date-only ISO: YYYY-MM-DD)
export async function getReportSummary(fromISO?: string, toISO?: string) {
  try {
    const where: any = { reportType: "DAILY" };
    if (fromISO || toISO) {
      where.reportDate = {} as any;
      if (fromISO) (where.reportDate as any).gte = new Date(fromISO);
      if (toISO) (where.reportDate as any).lte = new Date(toISO);
    }

    const recs = await prisma.report.findMany({ where });

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
    return { success: false as const, error: "Failed to get report summary" };
  }
}

// Realtime summary from receipts (date-only ISO: YYYY-MM-DD)
export async function getRealtimeSummary(fromISO: string, toISO: string) {
  try {
    const from = new Date(fromISO + "T00:00:00+07:00");
    const to = new Date(toISO + "T23:59:59.999+07:00");

    const receipts = await prisma.receipt.findMany({
      where: { receiptDate: { gte: from, lte: to } },
      select: { grandTotal: true },
    });

    const totalSales = receipts.reduce((acc, r) => acc + Number(r.grandTotal), 0);
    const numberOfOrders = receipts.length;

    const data: ReportSummary = { totalSales, numberOfOrders };
    return { success: true as const, data };
  } catch (e) {
    console.error("getRealtimeSummary error:", e);
    return { success: false as const, error: "Failed to get realtime summary" };
  }
}

// Top menus in range based on receipts -> orders -> order_menu
export async function getTopMenus(fromISO: string, toISO: string, limit = 10) {
  try {
    const from = new Date(fromISO + "T00:00:00+07:00");
    const to = new Date(toISO + "T23:59:59.999+07:00");

    const receipts = await prisma.receipt.findMany({
      where: { receiptDate: { gte: from, lte: to } },
      select: { orderID: true },
    });
    const orderIDs = receipts.map((r) => r.orderID);
    if (orderIDs.length === 0) return { success: true as const, data: [] as any[] };

    const rows = await prisma.order_Menu.groupBy({
      by: ["menuID"],
      where: { orderID: { in: orderIDs } },
      _sum: { quantity: true },
    });

    const menuMap = new Map<string, { menuName: string; price: number }>();
    if (rows.length > 0) {
      const menus = await prisma.menu.findMany({
        where: { menuID: { in: rows.map((r) => r.menuID) } },
        select: { menuID: true, menuName: true, price: true },
      });
      menus.forEach((m) => menuMap.set(m.menuID, { menuName: m.menuName, price: Number(m.price) }));
    }

    const data = rows
      .map((r) => {
        const meta = menuMap.get(r.menuID) || { menuName: r.menuID, price: 0 };
        const qty = r._sum.quantity ?? 0;
        return { menuID: r.menuID, menuName: meta.menuName, quantity: qty, revenue: qty * meta.price };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    return { success: true as const, data };
  } catch (e) {
    console.error("getTopMenus error:", e);
    return { success: false as const, error: "Failed to get top menus" };
  }
}

// Category breakdown in range
export async function getCategoryBreakdown(fromISO: string, toISO: string) {
  try {
    const from = new Date(fromISO + "T00:00:00+07:00");
    const to = new Date(toISO + "T23:59:59.999+07:00");

    const receipts = await prisma.receipt.findMany({
      where: { receiptDate: { gte: from, lte: to } },
      select: { orderID: true },
    });
    const orderIDs = receipts.map((r) => r.orderID);
    if (orderIDs.length === 0) return { success: true as const, data: [] as any[] };

    const items = await prisma.order_Menu.findMany({
      where: { orderID: { in: orderIDs } },
      select: {
        quantity: true,
        menu: {
          select: {
            price: true,
            categories: { select: { category: { select: { categoryID: true, categoryName: true } } } },
          },
        },
      },
    });

    const map = new Map<string, { categoryName: string; quantity: number; revenue: number }>();
    for (const it of items) {
      const price = Number(it.menu.price);
      const qty = it.quantity;
      const cats = it.menu.categories;
      if (cats.length === 0) {
        const key = "uncategorized";
        const cur = map.get(key) || { categoryName: "Uncategorized", quantity: 0, revenue: 0 };
        cur.quantity += qty;
        cur.revenue += qty * price;
        map.set(key, cur);
      } else {
        for (const c of cats) {
          const key = c.category.categoryID;
          const cur = map.get(key) || { categoryName: c.category.categoryName, quantity: 0, revenue: 0 };
          cur.quantity += qty;
          cur.revenue += qty * price;
          map.set(key, cur);
        }
      }
    }

    const data = Array.from(map.entries()).map(([categoryID, v]) => ({ categoryID, ...v }));
    return { success: true as const, data };
  } catch (e) {
    console.error("getCategoryBreakdown error:", e);
    return { success: false as const, error: "Failed to get category breakdown" };
  }
}
