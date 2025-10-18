"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getReceiptByID, type ReceiptView } from "@/actions/receipt";
import { toast } from "sonner";

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );

type ReceiptDetailPageProps = {
  receiptID: string;
};

export default function ReceiptDetailPage({ receiptID }: ReceiptDetailPageProps) {
  const router = useRouter();
  const [data, setData] = useState<ReceiptView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getReceiptByID(receiptID);
        if (!res.success || !res.data) throw new Error(res.error || "ไม่พบใบเสร็จ");
        setData(res.data);
      } catch (e: any) {
        toast.error(e.message || "โหลดใบเสร็จไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [receiptID]);

  if (loading) {
    return <div className="min-h-screen bg-[#FFFCE8] p-6">กำลังโหลด...</div>;
  }
  if (!data) {
    return <div className="min-h-screen bg-[#FFFCE8] p-6 text-red-600">ไม่พบใบเสร็จ</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFFCE8] p-6">
      <div className="mx-auto max-w-lg bg-white rounded-xl border border-[#c7a574] shadow p-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">ใบเสร็จรับเงิน</h2>
          <div className="text-xs text-gray-500">{new Date(data.date).toLocaleString("th-TH")}</div>
          <div className="text-xs text-gray-500 mt-1">ReceiptID: <span className="font-mono">{data.receiptID}</span></div>
        </div>

        <div className="text-sm mb-3">
          ผู้ขาย: <span className="font-semibold">{data.seller}</span>
        </div>

        <div className="border-b my-3" />

        <div className="mb-3">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>รายการ</span>
            <span>ราคา</span>
          </div>
          {data.items.map((it, idx) => (
            <div key={idx} className="flex justify-between py-1 text-sm">
              <span>{it.name} x{it.qty}</span>
              <span>{fmt(it.total)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span>ยอดสินค้า</span><span className="font-semibold">{fmt(data.subtotal)}</span></div>
          <div className="flex justify-between"><span>ส่วนลด</span><span>{fmt(data.discountAmount)}</span></div>
          <div className="flex justify-between"><span>ภาษี</span><span>{fmt(data.taxAmount)}</span></div>
          <div className="flex justify-between text-base"><span>ยอดสุทธิ</span><span className="font-bold">{fmt(data.grandTotal)}</span></div>
          <div className="flex justify-between"><span>ชำระโดย</span><span className="font-semibold">{data.paymentMethod === "CASH" ? "เงินสด" : "QR"}</span></div>
          <div className="flex justify-between"><span>รับเงิน</span><span>{fmt(data.amountPaid)}</span></div>
          <div className="flex justify-between"><span>เงินทอน</span><span>{fmt(data.changeAmount)}</span></div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button onClick={() => window.print()} className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">พิมพ์</button>
          <button onClick={() => router.back()} className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300">กลับ</button>
        </div>
      </div>
    </div>
  );
}
