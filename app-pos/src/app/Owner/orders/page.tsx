// src/app/Owner/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { listOrders, getOrderDetail, type OrderRow, type OrderDetail } from "@/actions/orders";
import { toast } from "sonner";

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const res = await listOrders();
      if (!res.success || !res.data) throw new Error(res.error || "โหลดรายการออเดอร์ไม่สำเร็จ");
      setRows(res.data);
    } catch (e: any) {
      toast.error(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openDetail = async (orderID: string) => {
    try {
      const res = await getOrderDetail(orderID);
      if (!res.success || !res.data) throw new Error(res.error || "เปิดรายละเอียดไม่สำเร็จ");
      setDetail(res.data);
    } catch (e: any) {
      toast.error(e.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCE8]">
      <div className="w-full px-6 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-[#7A4E1A]">Orders</h2>
          <button
            type="button"
            onClick={reload}
            className="flex h-9 items-center justify-center rounded-md bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            รีเฟรช
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#c7a574] bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "24%" }} />
            </colgroup>
            <thead className="bg-[#c7a574] text-white">
              <tr className="h-11">
                <th className="px-3 text-left">No</th>
                <th className="px-3 text-left">orderID</th>
                <th className="px-3 text-left">orderDateTime</th>
                <th className="px-3 text-left">userID</th>
                <th className="px-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-10 text-center" colSpan={5}>
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-gray-500" colSpan={5}>
                    ยังไม่มีข้อมูลออเดอร์
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.orderID} className="h-12 border-t border-[#eee] odd:bg-white even:bg-[#fff7ef]">
                    <td className="px-3">{i + 1}</td>
                    <td className="px-3 truncate">{r.orderID}</td>
                    <td className="px-3">{new Date(r.orderDateTime).toLocaleString("th-TH")}</td>
                    <td className="px-3 truncate">{r.userID}</td>
                    <td className="px-3">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => openDetail(r.orderID)}
                          className="inline-flex h-8 w-[96px] items-center justify-center rounded-md bg-[#cfe0ff] text-[#1b4fbf] hover:bg-[#bcd3ff]"
                        >
                          ดูรายละเอียด
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

      {/* Modal: รายละเอียดออเดอร์ */}
      {detail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-[480px] rounded-lg bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-center text-lg font-semibold">รายละเอียดออเดอร์</h3>
            <div className="mb-4 text-xs text-gray-600 grid grid-cols-1 gap-1">
              <div><span className="font-semibold">orderID:</span> {detail.orderID}</div>
              <div><span className="font-semibold">orderDateTime:</span> {new Date(detail.orderDateTime).toLocaleString("th-TH")}</div>
              <div><span className="font-semibold">userID:</span> {detail.userID}</div>
              <div><span className="font-semibold">ผู้ใช้:</span> {detail.userName}</div>
              {detail.description ? (
                <div><span className="font-semibold">หมายเหตุ:</span> {detail.description}</div>
              ) : null}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-1 text-left">สินค้า</th>
                  <th className="py-1 text-right">ราคา</th>
                  <th className="py-1 text-right">จำนวน</th>
                  <th className="py-1 text-right">รวม</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((it) => (
                  <tr key={it.menuID} className="border-b last:border-0">
                    <td className="py-1">{it.name}</td>
                    <td className="py-1 text-right">{it.price.toFixed(2)}</td>
                    <td className="py-1 text-right">{it.qty}</td>
                    <td className="py-1 text-right">{it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-md bg-gray-200 px-4 py-1.5 text-sm hover:bg-gray-300"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
