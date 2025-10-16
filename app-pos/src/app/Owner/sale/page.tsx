// src/app/Owner/sale/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Download, Printer, Trash2 } from "lucide-react";
import { listSales, getBillByOrderID, deleteSale, type SaleRow, type BillDetail } from "@/actions/sales";
import { toast } from "sonner";

export default function SalePage() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  // modal states
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [confirmDel, setConfirmDel] = useState<SaleRow | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const res = await listSales();
      if (res.success && res.data) setRows(res.data);
      else toast.error(res.error || "โหลดรายการขายไม่สำเร็จ");
    } catch (e: any) {
      toast.error(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

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

  // export CSV ง่ายๆ
  const handleExport = () => {
    const header = ["No", "OrderCode", "Seller", "Items", "Price", "Date"];
    const body = rows.map((r, i) => [
      (i + 1).toString(),
      r.orderCode,
      r.seller,
      r.itemsCount.toString(),
      r.price.toFixed(2),
      new Date(r.date).toLocaleString("th-TH"),
    ]);

    const csv = [header, ...body].map((arr) => arr.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FFFCE8]">
      <div className="w-full px-6 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-[#7A4E1A]">Sales Reports</h2>
          <button
            type="button"
            onClick={handleExport}
            className="flex h-9 w-[120px] items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#c7a574] bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "26%" }} />
            </colgroup>
            <thead className="bg-[#c7a574] text-white">
              <tr className="h-11">
                <th className="px-3 text-left">No</th>
                <th className="px-3 text-left">รหัสคำสั่งซื้อ</th>
                <th className="px-3 text-left">ผู้ขาย</th>
                <th className="px-3 text-left">รายการ</th>
                <th className="px-3 text-left">ราคา</th>
                <th className="px-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-10 text-center" colSpan={6}>กำลังโหลดข้อมูล...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-gray-500" colSpan={6}>ยังไม่มีข้อมูล</td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.orderID} className="h-12 border-t border-[#eee] odd:bg-white even:bg-[#fff7ef]">
                    <td className="px-3">{i + 1}</td>
                    <td className="px-3">{r.orderCode}</td>
                    <td className="px-3">{r.seller}</td>
                    <td className="px-3">{r.itemsCount} รายการ</td>
                    <td className="px-3">{r.price.toFixed(2)}</td>
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

      {/* 🧾 Modal: ใบเสร็จจาก DB */}
      {bill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-[420px] rounded-lg bg-white p-5 shadow-xl">
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
                        <span>{it.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </td>
                </tr>
                <tr>
                  <td className="border-t border-gray-300 py-2 font-semibold">รวม</td>
                  <td className="border-t border-gray-300 py-2 text-right font-semibold">
                    {bill.total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBill(null)}
                className="rounded-md bg-gray-200 px-4 py-1.5 text-sm hover:bg-gray-300"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md bg-blue-500 px-4 py-1.5 text-sm text-white hover:bg-blue-600"
              >
                พิมพ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑 Modal: ยืนยันลบ */}
      {confirmDel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-[360px] rounded-lg bg-white p-5 shadow-xl">
            <p className="text-center text-[#7A4E1A]">ต้องการลบหรือไม่</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDel(null)}
                className="rounded-md bg-gray-200 px-4 py-1.5 text-sm hover:bg-gray-300"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={doDelete}
                className="rounded-md bg-red-500 px-4 py-1.5 text-sm text-white hover:bg-red-600"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
