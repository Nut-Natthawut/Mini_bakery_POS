"use client";
import React, { useEffect, useMemo, useState } from "react";

// ⬇️ ใช้ actions/ไทป์ที่มีอยู่แล้วในโปรเจกต์ของคุณ
import { getMenus } from "@/actions/menu";
import { getCategories } from "@/actions/categories";
import type { MenuData, CategoryData } from "@/types/type";

/** ---------- Types (ฝั่งหน้า Discount) ---------- **/
type DiscountType = "THB" | "%";

type MenuItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  discountType?: DiscountType;
  discountValue?: number;
};

type DiscountRow = MenuItem & { finalPrice: number };

/** ---------- Utils ---------- **/
const round2 = (n: number) => Math.round(n * 100) / 100;

const calcFinalPrice = (item: MenuItem) => {
  const t = (item.discountType as DiscountType) ?? "THB";
  const v = item.discountValue ?? 0;
  if (t === "%") return Math.max(0, round2(item.price * (1 - v / 100)));
  // t === "THB"
  return Math.max(0, round2(item.price - v));
};

/** ---------- ดึงข้อมูลจริงจาก actions ---------- **/
async function fetchMenuFromActions(): Promise<MenuItem[]> {
  const [mRes, cRes] = await Promise.all([getMenus(), getCategories()]);

  if (!mRes.success || !mRes.data) {
    throw new Error(mRes.error || "โหลดเมนูไม่สำเร็จ");
  }

  // แผนที่ id -> ชื่อหมวด เพื่อแสดงชื่อหมวดในตาราง
  const catMap = new Map<string, string>();
  if (cRes?.success && cRes.data) {
    (cRes.data as CategoryData[]).forEach((c) =>
      catMap.set(c.categoryID, c.categoryName)
    );
  }

  // แปลง MenuData -> MenuItem สำหรับหน้า Discount
  return (mRes.data as MenuData[]).map((x) => ({
    id: x.menuID,
    code: x.menuID, // ถ้ามีฟิลด์ code แยก ใช้แทนได้
    name: x.menuName,
    // ใช้ชื่อหมวดตัวแรก ถ้ามีหลายหมวดจะเอา index 0 (ปรับตามที่ต้องการได้)
    category:
      (Array.isArray(x.categories) && x.categories.length > 0
        ? catMap.get(x.categories[0]) ?? x.categories[0]
        : "อื่น ๆ") || "อื่น ๆ",
    price: Number(x.price) || 0,
    // ตั้งค่าเริ่มต้น: ไม่มี NONE อีกแล้ว
    discountType: "THB",
    discountValue: 0,
  }));
}

// TODO: ต่อ API/Server Action จริงของคุณภายหลัง
async function saveDiscounts(rows: DiscountRow[]) {
  // ตัวอย่าง: await fetch("/api/menu/discounts", { method: "PATCH", headers:{'Content-Type':'application/json'}, body: JSON.stringify(rows) });
  console.log("payload to save", rows);
  return true;
}

/** ---------- Component ---------- **/
export default function DiscoutManage() {
  const [rows, setRows] = useState<DiscountRow[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);

  // โหลดเมนูจาก actions จริง
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const items = await fetchMenuFromActions();
        setRows(items.map((m) => ({ ...m, finalPrice: calcFinalPrice(m) })));
      } catch (e: any) {
        alert(e?.message || "เกิดข้อผิดพลาดในการโหลดเมนู");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const qq = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(qq) ||
        r.category.toLowerCase().includes(qq)
    );
  }, [q, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateRow = (id: string, patch: Partial<MenuItem>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next: MenuItem = { ...r, ...patch };
        return { ...next, finalPrice: calcFinalPrice(next) };
      })
    );
  };

  const handleSave = async () => {
    await saveDiscounts(rows);
    alert("บันทึกส่วนลดเรียบร้อย ✅ (ดู console สำหรับ payload)");
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="ค้นหา ชื่อ/หมวดหมู่"
          className="border rounded-lg px-3 py-2 w-full max-w-md focus:outline-none focus:ring"
        />
        <button
          onClick={handleSave}
          className="rounded-xl px-4 py-2 bg-[#BF9270] text-white shadow hover:brightness-110"
        >
          บันทึกส่วนลด
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="rounded-xl overflow-hidden border-2 border-black shadow">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-[#BF9270] text-white">
              <tr>
                <th className="p-2 text-left w-28">ส่วนลด</th>
                <th className="p-2 text-right w-32">ราคา</th>
                <th className="p-2 text-left">ชื่อสินค้า</th>
                <th className="p-2 text-left w-40">หมวดหมู่</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-300 bg-white">
              {loading ? (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={4}>
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={4}>
                    ไม่พบรายการ
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    {/* Discount cell */}
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded-lg px-2 py-1"
                          value={r.discountType ?? "THB"}
                          onChange={(e) =>
                            updateRow(r.id, {
                              discountType: e.target.value as DiscountType,
                            })
                          }
                        >
                          <option value="THB">฿</option>
                          <option value="%">%</option>
                        </select>

                        <input
                          type="number"
                          min={0}
                          className="border rounded-lg px-2 py-1 w-20 text-right"
                          value={r.discountValue ?? 0}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = raw === "" ? 0 : Number(raw);
                            updateRow(r.id, { discountValue: Math.max(0, val) });
                          }}
                        />

                        <span className="text-gray-400">↻</span>
                      </div>
                    </td>

                    {/* Price cell */}
                    <td className="p-2 text-right">
                      <div className="leading-tight">
                        <div className="line-through opacity-60">
                          ฿{r.price.toFixed(2)}
                        </div>
                        <div className="text-emerald-600 font-semibold">
                          ฿{r.finalPrice.toFixed(2)}
                        </div>
                      </div>
                    </td>

                    {/* Other cells */}
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.category}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2 justify-end">
        <button
          className="px-3 py-1 rounded-lg border disabled:opacity-40"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ก่อนหน้า
        </button>
        <span>
          หน้า {page} / {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded-lg border disabled:opacity-40"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
