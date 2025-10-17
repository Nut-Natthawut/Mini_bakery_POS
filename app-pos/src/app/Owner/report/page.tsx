"use client";

import { useEffect, useMemo, useState } from "react";
import { getReportSummary, getRealtimeSummary, getTopMenus, getCategoryBreakdown } from "@/actions/report";
import { toast } from "sonner";

type TopMenuRow = { menuID: string; menuName: string; quantity: number; revenue: number };
type CategoryRow = { categoryID: string; categoryName: string; quantity: number; revenue: number };

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

// ให้วันที่อิงเวลาไทย (UTC+7)
const thaiDateOnly = (d = new Date()) => {
  const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
};

export default function ReportPage() {
  const [from, setFrom] = useState<string>(thaiDateOnly());
  const [to, setTo] = useState<string>(thaiDateOnly());

  const [totalSales, setTotalSales] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [avgPerOrder, setAvgPerOrder] = useState(0);

  const [topMenus, setTopMenus] = useState<TopMenuRow[]>([]);
  const [byCategory, setByCategory] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isTodayRange = useMemo(() => {
    const iso = thaiDateOnly();
    return from === iso && to === iso;
  }, [from, to]);

  const quick = {
    today: () => {
      const t = thaiDateOnly();
      setFrom(t);
      setTo(t);
    },
    last7: () => {
      const now = new Date();
      const end = thaiDateOnly(now);
      const startDate = new Date(now);
      startDate.setUTCDate(startDate.getUTCDate() - 6);
      const start = thaiDateOnly(startDate);
      setFrom(start);
      setTo(end);
    },
    monthToDate: () => {
      const now = new Date();
      const end = thaiDateOnly(now);
      // ต้นเดือนตามเขตเวลาไทย
      const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const start = thaiDateOnly(first);
      setFrom(start);
      setTo(end);
    },
  };

  const load = async () => {
    try {
      setLoading(true);

      // Summary: ใช้สรุปจากตาราง Report เป็นหลัก
      const base = await getReportSummary(from, to);
      let total = 0;
      let count = 0;
      if (base.success && base.data) {
        total = base.data.totalSales;
        count = base.data.numberOfOrders;
      }

      // ถ้าเป็นช่วงวันนี้ ให้เติมด้วย realtime จาก Receipt
      if (isTodayRange) {
        const live = await getRealtimeSummary(from, to);
        if (live.success && live.data) {
          total = live.data.totalSales; // ใช้ค่า realtime ทับ เพื่อความสดใหม่
          count = live.data.numberOfOrders;
        }
      }

      setTotalSales(total);
      setOrderCount(count);
      setAvgPerOrder(count ? total / count : 0);

      // Top menus
      const tops = await getTopMenus(from, to, 10);
      setTopMenus(tops.success ? (tops.data as TopMenuRow[]) : []);

      // Category breakdown
      const cats = await getCategoryBreakdown(from, to);
      setByCategory(cats.success ? (cats.data as CategoryRow[]) : []);
    } finally {
      setLoading(false);
    }
  };

  const daysBetween = (fromStr: string, toStr: string) => {
    const out: string[] = [];
    const start = new Date(fromStr);
    const end = new Date(toStr);
    // Iterate by 1 day (UTC date strings already Thai-shifted upstream)
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  };

  const runRollupNow = async () => {
    try {
      setLoading(true);
      const days = daysBetween(from, to);
      toast.info(`Running rollup for ${days.length} day(s)...`);
      for (const day of days) {
        const resp = await fetch(`/api/report/rollup?day=${day}`, { method: "GET" });
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}));
          throw new Error(j?.error || `Rollup failed for ${day}`);
        }
      }
      toast.success("Rollup completed");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Run rollup failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  return (
    <div className="min-h-screen bg-[#FFFCE8]">
      <div className="w-full px-6 py-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-[#7A4E1A]">Summary Report</h2>
            <p className="text-xs text-[#7A4E1A]/70">สรุปยอดขาย, จำนวนบิล, เมนูขายดี และยอดตามหมวดหมู่</p>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col">
              <label className="text-xs text-[#7A4E1A]">จากวันที่</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded-md border px-2" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-[#7A4E1A]">ถึงวันที่</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 rounded-md border px-2" />
            </div>
            <button onClick={quick.today} className="h-9 rounded-md bg-white px-3 text-sm ring-1 ring-[#c7a574] hover:bg-[#fff7ef]">วันนี้</button>
            <button onClick={quick.last7} className="h-9 rounded-md bg-white px-3 text-sm ring-1 ring-[#c7a574] hover:bg-[#fff7ef]">7 วัน</button>
            <button onClick={quick.monthToDate} className="h-9 rounded-md bg-white px-3 text-sm ring-1 ring-[#c7a574] hover:bg-[#fff7ef]">เดือนนี้</button>
            <button
              onClick={runRollupNow}
              disabled={loading}
              className="h-9 rounded-md bg-[#E3B7A0] px-3 text-sm font-semibold text-[#7A4E1A] hover:bg-[#d7ab96] disabled:opacity-60"
            >
              Run Rollup Now
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-white p-4 ring-1 ring-[#ead9c7]">
            <div className="text-sm text-[#7A4E1A]/80">ยอดขายรวม</div>
            <div className="text-2xl font-semibold text-[#7A4E1A]">฿ {fmt(totalSales)}</div>
          </div>
          <div className="rounded-lg bg-white p-4 ring-1 ring-[#ead9c7]">
            <div className="text-sm text-[#7A4E1A]/80">จำนวนบิล</div>
            <div className="text-2xl font-semibold text-[#7A4E1A]">{orderCount}</div>
          </div>
          <div className="rounded-lg bg-white p-4 ring-1 ring-[#ead9c7]">
            <div className="text-sm text-[#7A4E1A]/80">เฉลี่ยต่อบิล</div>
            <div className="text-2xl font-semibold text-[#7A4E1A]">฿ {fmt(avgPerOrder)}</div>
          </div>
        </div>

        {/* Top Menus */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg bg-white p-4 ring-1 ring-[#ead9c7]">
            <div className="mb-2 font-semibold text-[#7A4E1A]">Top 10 เมนูขายดี</div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-[#7A4E1A]/70">
                  <tr>
                    <th className="py-1 pr-2">เมนู</th>
                    <th className="py-1 pr-2">จำนวน</th>
                    <th className="py-1 pr-2">ประมาณการยอด</th>
                  </tr>
                </thead>
                <tbody>
                  {topMenus.map((m) => (
                    <tr key={m.menuID} className="border-t border-[#f0e6db]">
                      <td className="py-1 pr-2">{m.menuName}</td>
                      <td className="py-1 pr-2">{m.quantity}</td>
                      <td className="py-1 pr-2">฿ {fmt(m.revenue)}</td>
                    </tr>
                  ))}
                  {!loading && topMenus.length === 0 && (
                    <tr><td colSpan={3} className="py-2 text-center text-[#7A4E1A]/60">ไม่มีข้อมูล</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-lg bg-white p-4 ring-1 ring-[#ead9c7]">
            <div className="mb-2 font-semibold text-[#7A4E1A]">ยอดตามหมวดหมู่</div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-[#7A4E1A]/70">
                  <tr>
                    <th className="py-1 pr-2">หมวดหมู่</th>
                    <th className="py-1 pr-2">จำนวน</th>
                    <th className="py-1 pr-2">ประมาณการยอด</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory.map((c) => (
                    <tr key={c.categoryID} className="border-t border-[#f0e6db]">
                      <td className="py-1 pr-2">{c.categoryName}</td>
                      <td className="py-1 pr-2">{c.quantity}</td>
                      <td className="py-1 pr-2">฿ {fmt(c.revenue)}</td>
                    </tr>
                  ))}
                  {!loading && byCategory.length === 0 && (
                    <tr><td colSpan={3} className="py-2 text-center text-[#7A4E1A]/60">ไม่มีข้อมูล</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
