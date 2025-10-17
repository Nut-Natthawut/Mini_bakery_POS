"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listReceipts, type ReceiptRow } from "@/actions/receipt";
import { toast } from "sonner";

const fmt = (n:number) =>
  new Intl.NumberFormat("th-TH",{minimumFractionDigits:2, maximumFractionDigits:2}).format(Number(n||0));

export default function ReceiptIndexPage() {
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    try {
      setLoading(true);
      const res = await listReceipts();
      if (res.success && res.data) setRows(res.data);
      else toast.error(res.error || "โหลดใบเสร็จไม่สำเร็จ");
    } catch (e:any) {
      toast.error(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const data = useMemo(() => rows, [rows]);

  return (
    <div className="min-h-screen bg-[#FFFCE8]">
      <div className="w-full px-6 py-6 space-y-4">
        <h2 className="text-[20px] font-semibold text-[#7A4E1A]">Receipts</h2>

        <div className="overflow-hidden rounded-xl border border-[#c7a574] bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width:"6%" }} />
              <col style={{ width:"24%" }} />
              <col style={{ width:"18%" }} />
              <col style={{ width:"10%" }} />
              <col style={{ width:"14%" }} />
              <col style={{ width:"10%" }} />
              <col style={{ width:"18%" }} />
            </colgroup>

            <thead className="bg-[#c7a574] text-white">
              <tr className="h-11">
                <th className="px-3 text-left">No</th>
                <th className="px-3 text-left">ReceiptID</th>
                <th className="px-3 text-left">OrderID</th>
                <th className="px-3 text-left">รายการ</th>
                <th className="px-3 text-left">ยอดสุทธิ</th>
                <th className="px-3 text-left">ชำระ</th>
                <th className="px-3 text-center">วันที่</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center">กำลังโหลด...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-gray-500">ยังไม่มีใบเสร็จ</td></tr>
              ) : (
                data.map((r, i) => (
                  <tr key={r.receiptID} className="h-12 border-t border-[#eee] odd:bg-white even:bg-[#fff7ef]">
                    <td className="px-3">{i+1}</td>
                    <td className="px-3">
                      <Link href={`/Owner/receipt/${r.receiptID}`} className="text-blue-600 hover:underline">
                        {r.receiptID}
                      </Link>
                      <div className="text-xs text-gray-500">{r.seller}</div>
                    </td>
                    <td className="px-3">{r.orderID}</td>
                    <td className="px-3">{r.itemsCount} รายการ</td>
                    <td className="px-3">{fmt(r.grandTotal)}</td>
                    <td className="px-3">{r.paymentMethod === "CASH" ? "เงินสด" : "QR"}</td>
                    <td className="px-3 text-center">
                      {new Date(r.receiptDate).toLocaleString("th-TH")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
