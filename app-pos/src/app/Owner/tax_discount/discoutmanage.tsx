/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useMemo, useState } from "react";

import { getMenus, updateDiscounts } from "@/actions/menu";
import { getCategories } from "@/actions/categories";
// ไม่ต้อง import updateSystemConfig ถ้าไม่อยากคุยกับ server เรื่อง VAT อีก
import { getSystemConfig } from "@/actions/systemConfig";

import type { MenuData, CategoryData } from "@/types/type";

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

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const clampPct = (v: number) => Math.min(100, Math.max(0, Number(v || 0)));
const nonNeg = (v: number) => Math.max(0, Number(v || 0));

const calcFinalPrice = (item: MenuItem) => {
  const t = (item.discountType as DiscountType) ?? "THB";
  const v = Number(item.discountValue ?? 0);
  if (t === "%") return Math.max(0, round2(item.price * (1 - clampPct(v) / 100)));
  return Math.max(0, round2(item.price - nonNeg(v)));
};

// ===== Local VAT hook =====
const VAT_KEY = "pos.vatPct";
function useLocalVat(defaultPct = 7) {
  const [vatPct, setVatPct] = useState<number>(defaultPct);
  useEffect(() => {
    const raw = localStorage.getItem(VAT_KEY);
    if (raw != null) {
      const v = Number(raw);
      if (Number.isFinite(v)) setVatPct(Math.min(100, Math.max(0, v)));
    }
  }, []);
  const updateVat = (v: number) => {
    const vv = Math.min(100, Math.max(0, Number(v || 0)));
    setVatPct(vv);
    localStorage.setItem(VAT_KEY, String(vv));
  };
  const resetVat = () => updateVat(defaultPct);
  return { vatPct, updateVat, resetVat };
}

export default function DiscountManage() {
  const [rows, setRows] = useState<DiscountRow[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);

  // ค่า default discount ยังอ่าน/เขียนกับ server ได้ตามเดิม (หรือจะเปลี่ยนเป็น localStorage ก็ได้)
  const [defaultPct, setDefaultPct] = useState<number>(0);

  // VAT local-only
  const { vatPct, updateVat, resetVat } = useLocalVat(7);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [mRes, cRes, cfgRes] = await Promise.all([
          getMenus(),
          getCategories(),
          getSystemConfig(), // ใช้อ่านค่า defaultDiscountPct ได้ถ้าต้องการ
        ]);

        if (!mRes?.success || !mRes.data) throw new Error(mRes?.error || "โหลดเมนูไม่สำเร็จ");

        const catMap = new Map<string, string>();
        if (cRes?.success && cRes.data) {
          (cRes.data as CategoryData[]).forEach((c) => catMap.set(c.categoryID, c.categoryName));
        }

        if (cfgRes?.success && cfgRes.data) {
          const cfg = cfgRes.data as any;
          setDefaultPct(Number(cfg.defaultDiscountPct ?? 0));
          // ไม่ยุ่งกับ taxRatePct ของ server แล้ว
        }

        const items: MenuItem[] = (mRes.data as MenuData[]).map((x) => ({
          id: x.menuID,
          code: x.menuID,
          name: x.menuName,
          category:
            (Array.isArray(x.categories) && x.categories.length > 0
              ? catMap.get(x.categories[0]) ?? x.categories[0]
              : "อื่น ๆ") || "อื่น ๆ",
          price: Number(x.price) || 0,
          discountType: ((x as any).discountType as DiscountType) ?? "THB",
          discountValue: Number((x as any).discountValue ?? 0),
        }));

        setRows(items.map((m) => ({ ...m, finalPrice: calcFinalPrice(m) })));
      } catch (e: any) {
        alert(e?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const qq = q.toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(qq) || r.category.toLowerCase().includes(qq));
  }, [q, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateRow = (id: string, patch: Partial<MenuItem>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        let next: MenuItem = { ...r, ...patch };
        const nextType = (patch.discountType ?? r.discountType) as DiscountType | undefined;
        const rawVal =
          patch.discountValue !== undefined ? Number(patch.discountValue) : Number(r.discountValue ?? 0);
        if (nextType === "%") next.discountValue = clampPct(rawVal);
        else next.discountValue = nonNeg(rawVal);
        return { ...next, finalPrice: calcFinalPrice(next) } as DiscountRow;
      })
    );
  };

  const applyDefaultDiscountToAll = () => {
    if (!Number.isFinite(defaultPct) || defaultPct < 0) {
      alert("กรุณาตั้งค่า 'ส่วนลดเริ่มต้น (%)' ให้ถูกต้อง");
      return;
    }
    setRows((prev) =>
      prev.map((r) => {
        const next: MenuItem = { ...r, discountType: "%", discountValue: clampPct(defaultPct) };
        return { ...next, finalPrice: calcFinalPrice(next) } as DiscountRow;
      })
    );
  };

  const handleSaveDiscounts = async () => {
    try {
      const payload = rows.map((r) => ({
        menuID: r.id,
        discountType: (r.discountType ?? "THB") as DiscountType,
        discountValue:
          (r.discountType ?? "THB") === "%"
            ? clampPct(Number(r.discountValue ?? 0))
            : nonNeg(Number(r.discountValue ?? 0)),
      }));
      const res = await updateDiscounts(payload as any);
      if (!res?.success) throw new Error(res?.error || "บันทึกไม่สำเร็จ");
      alert("บันทึกส่วนลดเรียบร้อย ✅");
    } catch (e: any) {
      alert(e?.message || "บันทึกส่วนลดไม่สำเร็จ");
    }
  };

  // ======= NEW: บันทึก VAT เฉพาะเครื่อง (localStorage) =======
  const handleSaveVatLocal = () => {
    updateVat(vatPct); // useLocalVat จะเขียน localStorage ให้
    alert("บันทึก VAT (เฉพาะเครื่องนี้) สำเร็จ ✅");
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header & Config */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหา ชื่อ/หมวดหมู่"
            className="border rounded-lg px-3 py-2 w-full sm:max-w-md focus:outline-none focus:ring"
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm">
              ส่วนลดเริ่มต้น (%)
              <input
                type="number"
                min={0}
                max={100}
                value={defaultPct}
                onChange={(e) => setDefaultPct(clampPct(Number(e.target.value)))}
                className="ml-2 w-20 border rounded-lg px-2 py-1 text-right"
              />
            </label>

            <button
              onClick={applyDefaultDiscountToAll}
              className="rounded-xl px-3 py-2 border shadow hover:bg-gray-50"
              title="ตั้งส่วนลดของทุกรายการให้เท่ากับค่า Default (%)"
            >
              ใช้ค่า Default (%) ทุกช่อง
            </button>

            <label className="text-sm">
              VAT (%)
              <input
                type="number"
                min={0}
                max={100}
                value={vatPct}
                onChange={(e) => updateVat(clampPct(Number(e.target.value)))}
                className="ml-2 w-20 border rounded-lg px-2 py-1 text-right"
                title="VAT เฉพาะเครื่องนี้ (local)"
              />
            </label>

            <button
              onClick={handleSaveVatLocal}
              className="rounded-xl px-3 py-2 border shadow hover:bg-gray-50"
              title="บันทึก VAT ลงเครื่องนี้ (localStorage)"
            >
              บันทึก VAT (เครื่องนี้)
            </button>

            <button
              onClick={resetVat}
              className="rounded-xl px-3 py-2 border shadow hover:bg-gray-50"
              title="รีเซ็ต VAT เป็น 7%"
            >
              รีเซ็ต VAT 7%
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDiscounts}
            className="rounded-xl px-4 py-2 bg-[#BF9270] text-white shadow hover:brightness-110"
          >
            บันทึกส่วนลดรายการ
          </button>
        </div>
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
                            const num = e.target.value === "" ? 0 : Number(e.target.value);
                            if ((r.discountType ?? "THB") === "%") {
                              updateRow(r.id, { discountValue: clampPct(num) });
                            } else {
                              updateRow(r.id, { discountValue: nonNeg(num) });
                            }
                          }}
                        />

                        <button
                          className="text-gray-400 hover:text-gray-700"
                          title="ล้างส่วนลดรายการนี้"
                          onClick={() =>
                            updateRow(r.id, { discountValue: 0, discountType: r.discountType })
                          }
                        >
                          ↻
                        </button>
                      </div>
                    </td>

                    <td className="p-2 text-right">
                      <div className="leading-tight">
                        <div className="line-through opacity-60">฿{r.price.toFixed(2)}</div>
                        <div className="text-emerald-600 font-semibold">฿{r.finalPrice.toFixed(2)}</div>
                      </div>
                    </td>

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
        <span>หน้า {page} / {totalPages}</span>
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
