// src/app/Owner/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Info, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { listOrders, getOrderDetail, voidPendingOrder } from "@/actions/orders";
import type { OrderRow, OrderDetail, OrderStatus, OrderItemLine } from "@/actions/orders";

/* ========= helpers ========= */
const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type OrderItemLineView = OrderItemLine & { finalLineTotal?: number };

function getLineTotal(it: OrderItemLine): number {
  const v = (it as OrderItemLineView).finalLineTotal;
  return typeof v === "number" ? v : it.total;
}

// เติมส่วนลดและ VAT 7% ให้เสมอ หาก server ไม่ส่งมา
const TAX_RATE = 0.07;
function enrichDetail(raw: OrderDetail): OrderDetail {
  const already =
    typeof raw.discountAmount === "number" &&
    typeof raw.taxAmount === "number" &&
    typeof raw.grandTotal === "number";

  if (already) return raw;

  const subtotal = Number(raw.subtotal || 0);
  const afterSubtotal = (raw.items || []).reduce((s, it) => s + getLineTotal(it), 0);

  const calculatedDiscount =
    afterSubtotal > 0 ? Math.max(0, round2(subtotal - afterSubtotal)) : 0;

  const base = afterSubtotal > 0 ? afterSubtotal : subtotal;
  const vat = round2(base * TAX_RATE);
  const grand = round2(base + vat);

  return {
    ...raw,
    discountAmount: typeof raw.discountAmount === "number" ? raw.discountAmount : calculatedDiscount,
    taxAmount: typeof raw.taxAmount === "number" ? raw.taxAmount : vat,
    grandTotal: typeof raw.grandTotal === "number" ? raw.grandTotal : grand,
  };
}

/* ========= Page Component (default export เดียว) ========= */
export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  // filters (อนาคตเผื่อใช้)
  const [status] = useState<OrderStatus | "ALL">("ALL");
  const [from] = useState<string>("");
  const [to] = useState<string>("");

  // modals
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [confirmVoidID, setConfirmVoidID] = useState<string | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const res = await listOrders({
        status: status === "ALL" ? undefined : status,
        from: from || undefined,
        to: to || undefined,
      });
      if (res.success && res.data) setRows(res.data);
      else toast.error(res.error || "โหลดรายการออเดอร์ไม่สำเร็จ");
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

  const openDetail = async (orderID: string) => {
    try {
      const res = await getOrderDetail(orderID);
      if (!res.success || !res.data) throw new Error(res.error || "ไม่พบรายละเอียดออเดอร์");
      setDetail(enrichDetail(res.data));
    } catch (e: any) {
      toast.error(e.message || "เปิดรายละเอียดไม่สำเร็จ");
    }
  };

  const doVoid = async () => {
    if (!confirmVoidID) return;
    try {
      const res = await voidPendingOrder(confirmVoidID);
      if (!res.success) throw new Error(res.error || "ยกเลิกไม่สำเร็จ");
      toast.success("ยกเลิกออเดอร์เรียบร้อย");
      setConfirmVoidID(null);
      reload();
    } catch (e: any) {
      toast.error(e.message || "ยกเลิกออเดอร์ไม่สำเร็จ");
    }
  };

  const handleExport = () => {
    const header = [
      "No",
      "OrderID",
      "ReceiptID",
      "Datetime",
      "Seller",
      "Items",
      "Total (incl. VAT)",
      "Status",
    ];
    const body = rows.map((r, i) => [
      (i + 1).toString(),
      r.orderID,
      r.receiptID ?? "",
      new Date(r.orderDateTime).toLocaleString("th-TH"),
      r.seller,
      r.itemsCount.toString(),
      r.total.toFixed(2),
      r.status,
    ]);
    const csv = [header, ...body]
      .map((arr) => arr.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRows = useMemo(() => rows, [rows]);

  return (
    <div className="min-h-screen bg-[#FFFCE8]">
      <div className="w-full px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[20px] font-semibold text-[#7A4E1A]">รายการออเดอร์</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* ตาราง */}
        <div className="overflow-hidden rounded-xl border border-[#c7a574] bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead className="bg-[#c7a574] text-white">
              <tr className="h-11">
                <th className="px-3 text-left">No</th>
                <th className="px-3 text-left">OrderID / เวลา</th>
                <th className="px-3 text-left">ReceiptID</th>
                <th className="px-3 text-left">รายการ</th>
                <th className="px-3 text-left">ยอด (รวม VAT)</th>
                <th className="px-3 text-left">สถานะ</th>
                <th className="px-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-10 text-center" colSpan={7}>
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-gray-500" colSpan={7}>
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, i) => (
                  <tr key={r.orderID} className="h-12 border-t border-[#eee] odd:bg-white even:bg-[#fff7ef]">
                    <td className="px-3">{i + 1}</td>
                    <td className="px-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{r.orderID}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(r.orderDateTime).toLocaleString("th-TH")}
                        </span>
                      </div>
                    </td>
                    <td className="px-3">{r.receiptID ?? "-"}</td>
                    <td className="px-3">{r.itemsCount} รายการ</td>
                    <td className="px-3">{r.total.toFixed(2)}</td>
                    <td className="px-3">
                      {r.status === "PAID" ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          ชำระแล้ว
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                          รอชำระ
                        </span>
                      )}
                    </td>
                    <td className="px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(r.orderID)}
                          className="inline-flex h-8 w-[88px] items-center justify-center gap-1 rounded-md bg-[#e9ecff] text-[#1b4fbf] hover:bg-[#dfe6ff]"
                        >
                          <Info className="h-4 w-4" />
                          รายละเอียด
                        </button>

                        {r.status !== "PAID" && (
                          <button
                            type="button"
                            onClick={() => setConfirmVoidID(r.orderID)}
                            className="inline-flex h-8 w-[104px] items-center justify-center gap-1 rounded-md bg-[#ffd4d4] text-[#9b1c1c] hover:bg-[#ffc3c3]"
                          >
                            <Trash2 className="h-4 w-4" />
                            ยกเลิก
                          </button>
                        )}
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
            <h3 className="mb-1 text-center text-lg font-semibold">รายละเอียดออเดอร์</h3>
            <div className="mb-2 text-center text-xs text-gray-500">
              {new Date(detail.orderDateTime).toLocaleString("th-TH")}
            </div>

            <div className="mb-1 text-sm text-[#7A4E1A]">
              ผู้ขาย: <span className="font-medium text-black">{detail.seller}</span>
            </div>

            <div className="my-3 border-b" />

            <div className="mb-3">
              <div className="mb-2 flex justify-between text-sm font-semibold">
                <span>รายการ</span>
                <span>ราคา</span>
              </div>

              {detail.items.map((it, idx) => {
                const line = getLineTotal(it);
                return (
                  <div key={idx} className="flex items-center justify-between py-1 text-sm">
                    <span>
                      {it.name} x{it.qty}
                    </span>
                    <span>{fmt(line)}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>ยอดสินค้า (ก่อนลด)</span>
                <span className="font-semibold">{fmt(detail.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>ส่วนลด</span>
                <span>{fmt(detail.discountAmount ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (7%)</span>
                <span>{fmt(detail.taxAmount ?? 0)}</span>
              </div>

              <div className="flex justify-between text-base">
                <span>ยอดสุทธิ</span>
                <span className="font-semibold">
                  {fmt(
                    detail.grandTotal ??
                      detail.subtotal - (detail.discountAmount ?? 0) + (detail.taxAmount ?? 0)
                  )}
                </span>
              </div>

              {detail.status === "PAID" && (
                <>
                  <div className="flex justify-between">
                    <span>ชำระโดย</span>
                    <span className="font-semibold">
                      {detail.paymentMethod === "CASH" ? "เงินสด" : "QR"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>รับเงิน</span>
                    <span>{fmt(detail.amountPaid ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เงินทอน</span>
                    <span>{fmt(detail.changeAmount ?? 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-md bg-gray-200 px-4 py-1.5 text-sm hover:bg-gray-300"
              >
                ปิด
              </button>

            {detail.status === "PAID" && (
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md bg-blue-500 px-4 py-1.5 text-sm text-white hover:bg-blue-600"
              >
                <Printer className="mr-1 inline-block h-4 w-4" />
                พิมพ์
              </button>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันยกเลิก (เฉพาะ PENDING) */}
      {confirmVoidID && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-[360px] rounded-lg bg-white p-5 shadow-xl">
            <p className="text-center text-[#7A4E1A]">ต้องการยกเลิกออเดอร์นี้หรือไม่</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmVoidID(null)}
                className="rounded-md bg-gray-200 px-4 py-1.5 text-sm hover:bg-gray-300"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={doVoid}
                className="rounded-md bg-red-500 px-4 py-1.5 text-sm text-white hover:bg-red-600"
              >
                ยกเลิกออเดอร์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
