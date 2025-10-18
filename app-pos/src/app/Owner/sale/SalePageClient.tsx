"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Trash2, Calendar, RefreshCw } from "lucide-react";
import { listSales, getBillByOrderID, deleteSale, type BillDetail } from "@/actions/sales";
import { getReportSummary } from "@/actions/report";
import { toast } from "sonner";

// แถวในตารางขาย (ใบเสร็จ)
type SaleRow = {
  orderID: string;
  orderCode: string;       // receiptID
  seller: string;
  itemsCount: number;
  price: number;           // grandTotal
  date: string;            // ISO
  paymentMethod: "CASH" | "QR";
};

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );

const toISODateOnly = (d: Date) => d.toISOString().slice(0, 10);

export default function SalePage() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [confirmDel, setConfirmDel] = useState<SaleRow | null>(null);

  // filter
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [seller, setSeller] = useState<string>("all");
  const [method, setMethod] = useState<"all" | "CASH" | "QR">("all");

  // summary จาก Report
  const [repTotalSales, setRepTotalSales] = useState<number>(0);
  const [repOrderCount, setRepOrderCount] = useState<number>(0);

  const reload = async () => {
    try {
      setLoading(true);

      // 1) โหลดตารางขาย (จากใบเสร็จจริง)
      const resSales = await listSales();
      if (!resSales.success || !resSales.data) throw new Error(resSales.error || "โหลดข้อมูลขายไม่สำเร็จ");
      setRows(resSales.data as SaleRow[]);

      // 2) โหลดสรุปจากตาราง Report (daily reports)
      const resRep = await getReportSummary(from, to);
      if (resRep.success && resRep.data) {
        setRepTotalSales(resRep.data.totalSales);
        setRepOrderCount(resRep.data.numberOfOrders);
      } else {
        setRepTotalSales(0);
        setRepOrderCount(0);
        if (resRep.error) console.warn(resRep.error);
      }
    } catch (e: any) {
      toast.error(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เมื่อ user เปลี่ยนวันที่ กดรีเฟรช (เพื่ออ่าน summary ใหม่จาก Report)
  useEffect(() => {
    (async () => {
      try {
        const resRep = await getReportSummary(from, to);
        if (resRep.success && resRep.data) {
          setRepTotalSales(resRep.data.totalSales);
          setRepOrderCount(resRep.data.numberOfOrders);
        } else {
          setRepTotalSales(0);
          setRepOrderCount(0);
        }
      } catch (e) {
        setRepTotalSales(0);
        setRepOrderCount(0);
      }
    })();
  }, [from, to]);

  // dropdown ผู้ขาย
  const sellerOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.seller || "-"));
    return ["all", ...Array.from(s)];
  }, [rows]);

  // filter rows (ตามช่วงวันที่/ผู้ขาย/วิธีจ่าย)
const filtered = useMemo(() => {
  if (!from && !to) {
    return rows.filter((r) => {
      if (seller !== "all" && r.seller !== seller) return false;
      if (method !== "all" && r.paymentMethod !== method) return false;
      return true;
    });
  }
  const fromTime = from ? new Date(from + "T00:00:00").getTime() : -Infinity;
  const toTime   = to   ? new Date(to   + "T23:59:59.999").getTime() : Infinity;
  return rows.filter((r) => {
    const t = new Date(r.date).getTime();
    if (t < fromTime || t > toTime) return false;
    if (seller !== "all" && r.seller !== seller) return false;
    if (method !== "all" && r.paymentMethod !== method) return false;
    return true;
  });
}, [rows, from, to, seller, method]);

  // summary cards (CASH/QR/เฉลี่ย) คิดจาก filtered rows จริง
  const totalCash = filtered
    .filter((r) => r.paymentMethod === "CASH")
    .reduce((s, r) => s + Number(r.price || 0), 0);

  const totalQR = filtered
    .filter((r) => r.paymentMethod === "QR")
    .reduce((s, r) => s + Number(r.price || 0), 0);

  const avgPerOrder = repOrderCount ? repTotalSales / repOrderCount : 0;

  const openBill = async (row: SaleRow) => {
    try {
      const res = await getBillByOrderID(row.orderID);
      if (!res.success || !res.data) throw new Error(res.error || "ไม่พบบิล");
      setBill(res.data);
    } catch (e: any) {
      toast.error(e.message || "เปิดบิลไม่สำเร็จ");
    }
  };

  const doDelete = async () => {
    if (!confirmDel) return;
    try {
      const res = await deleteSale(confirmDel.orderID);
      if (!res.success) throw new Error(res.error || "ลบไม่สำเร็จ");
      toast.success("ลบรายการเรียบร้อย");
      setConfirmDel(null);
      reload();
    } catch (e: any) {
      toast.error(e.message || "ลบรายการไม่สำเร็จ");
    }
  };

  // Export CSV เฉพาะ filtered rows
  const handleExport = () => {
    const header = ["No", "ReceiptID", "Seller", "Items", "Price", "Date", "PaymentMethod"];
    const body = filtered.map((r, i) => [
      (i + 1).toString(),
      r.orderCode,
      r.seller,
      r.itemsCount.toString(),
      r.price.toFixed(2),
      new Date(r.date).toLocaleString("th-TH"),
      r.paymentMethod,
    ]);

    const csv = [header, ...body].map((arr) => arr.map((v) => `"${v}"`).join(",")).join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_${from || "all"}_${to || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FFFCE8]">
      <div className="w-full px-6 py-6 space-y-4">
        {/* Header + Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-[#7A4E1A]">Sales Reports</h2>
            <p className="text-xs text-[#7A4E1A]/70">เฉพาะรายการที่ปิดการขายแล้ว (มีใบเสร็จ)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reload}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-[#7A4E1A] ring-1 ring-[#c7a574] hover:bg-[#fff7ef]"
            >
              <RefreshCw className="h-4 w-4" />
              รีเฟรช
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-[#c7a574] bg-white p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">วันที่เริ่มต้น</label>
              <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9 w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">วันที่สิ้นสุด</label>
              <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9 w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-1 grid grid-cols-2 sm:grid-cols-1 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">ผู้ขาย</label>
                <select
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm outline-none"
                >
                  {sellerOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "all" ? "ทั้งหมด" : opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">วิธีชำระเงิน</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as "all" | "CASH" | "QR")}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm outline-none"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="CASH">CASH</option>
                  <option value="QR">QR</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-[#c7a574] bg-white p-4">
            <div className="text-xs text-gray-600">ยอดขายรวม (Report)</div>
            <div className="mt-1 text-2xl font-semibold text-[#7A4E1A]">฿ {fmt(repTotalSales)}</div>
          </div>
          <div className="rounded-xl border border-[#c7a574] bg-white p-4">
            <div className="text-xs text-gray-600">จำนวนบิล (Report)</div>
            <div className="mt-1 text-2xl font-semibold text-[#7A4E1A]">{repOrderCount}</div>
          </div>
          <div className="rounded-xl border border-[#c7a574] bg-white p-4">
            <div className="text-xs text-gray-600">เฉลี่ย/บิล</div>
            <div className="mt-1 text-2xl font-semibold text-[#7A4E1A]">฿ {fmt(avgPerOrder)}</div>
          </div>
          <div className="rounded-xl border border-[#c7a574] bg-white p-4">
            <div className="text-xs text-gray-600">CASH (คำนวณจากรายการที่กรอง)</div>
            <div className="mt-1 text-2xl font-semibold text-[#0D9488]">฿ {fmt(totalCash)}</div>
          </div>
          <div className="rounded-xl border border-[#c7a574] bg-white p-4">
            <div className="text-xs text-gray-600">QR (คำนวณจากรายการที่กรอง)</div>
            <div className="mt-1 text-2xl font-semibold text-[#2563EB]">฿ {fmt(totalQR)}</div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#c7a574] bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <thead className="bg-[#c7a574] text-white">
              <tr className="h-11">
                <th className="px-3 text-left">No</th>
                <th className="px-3 text-left">ReceiptID</th>
                <th className="px-3 text-left">ผู้ขาย</th>
                <th className="px-3 text-left">รายการ</th>
                <th className="px-3 text-left">ราคา</th>
                <th className="px-3 text-left">ชำระ</th>
                <th className="px-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-10 text-center" colSpan={7}>กำลังโหลดข้อมูล...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-3 py-10 text-center text-gray-500" colSpan={7}>ไม่พบรายการตามเงื่อนไข</td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.orderID} className="h-12 border-t border-[#eee] odd:bg-white even:bg-[#fff7ef]">
                    <td className="px-3">{i + 1}</td>
                    <td className="px-3">{r.orderCode}</td>
                    <td className="px-3">{r.seller}</td>
                    <td className="px-3">{r.itemsCount} รายการ</td>
                    <td className="px-3">฿ {fmt(r.price)}</td>
                    <td className="px-3">{r.paymentMethod}</td>
                    <td className="px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openBill(r)}
                          className="inline-flex h-8 w-[88px] items-center justify-center gap-1 rounded-md bg-[#cfe0ff] text-[#1b4fbf] hover:bg-[#bcd3ff]"
                        >
                          <Printer className="h-4 w-4" />
                          พิมพ์
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDel(r)}
                          className="inline-flex h-8 w-[88px] items-center justify-center gap-1 rounded-md bg-[#ffd4d4] text-[#9b1c1c] hover:bg-[#ffc3c3]"
                        >
                          <Trash2 className="h-4 w-4" />
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: ใบเสร็จ */}
      {bill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-[440px] rounded-lg bg-white p-5 shadow-xl">
            <h3 className="mb-3 text-center text-lg font-semibold">บิล</h3>
            <div className="text-xs text-gray-500 mb-2 text-center">
              {new Date(bill.date).toLocaleString("th-TH")}
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold">รหัสคำสั่งซื้อ</td>
                  <td className="py-1 text-right">{bill.orderCode}</td>
                </tr>
                <tr>
                  <td className="pt-2 font-semibold">รายการ</td>
                  <td className="pt-2 text-right font-semibold">ราคา</td>
                </tr>
                <tr>
                  <td className="border-t border-gray-300 py-2 text-gray-700" colSpan={2}>
                    {bill.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span>{it.name} (x{it.qty})</span>
                        <span>{fmt(it.total)}</span>
                      </div>
                    ))}
                  </td>
                </tr>
                {typeof bill.discount === 'number' && (
                  <tr>
                    <td className="border-t border-gray-300 py-2">ส่วนลด</td>
                    <td className="border-t border-gray-300 py-2 text-right">- {fmt(bill.discount)}</td>
                  </tr>
                )}
                {typeof bill.vat === 'number' && (
                  <tr>
                    <td className="py-1">VAT</td>
                    <td className="py-1 text-right">{fmt(bill.vat)}</td>
                  </tr>
                )}
                <tr>
                  <td className="border-t border-gray-300 py-2 font-semibold">รวม</td>
                  <td className="border-t border-gray-300 py-2 text-right font-semibold">{fmt(bill.total)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setBill(null)} className="rounded-md bg-gray-200 px-4 py-1.5 text-sm hover:bg-gray-300">
                ปิด
              </button>
              <button type="button" onClick={() => window.print()} className="rounded-md bg-blue-500 px-4 py-1.5 text-sm text-white hover:bg-blue-600">
                พิมพ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันลบ */}
      {confirmDel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-[360px] rounded-lg bg-white p-5 shadow-xl">
            <p className="text-center text-[#7A4E1A]">ต้องการลบรายการนี้หรือไม่</p>
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" onClick={() => setConfirmDel(null)} className="rounded-md bg-gray-200 px-4 py-1.5 text-sm hover:bg-gray-300">
                ยกเลิก
              </button>
              <button type="button" onClick={doDelete} className="rounded-md bg-red-500 px-4 py-1.5 text-sm text-white hover:bg-red-600">
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
