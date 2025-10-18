"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { MenuData, CategoryData } from "@/types/type";

type DiscountType = "THB" | "%";

type MenuItem = {
  id: string;
  name: string;
  categoryName: string;
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

export default function DiscountManage() {
  const [rows, setRows] = useState<DiscountRow[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const pageSize = 10;

  const [vatPct, setVatPct] = useState<number>(7);
  const [defaultPct, setDefaultPct] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [{ getMenus }, { getCategories }, { getSystemConfig }] = await Promise.all([
          import("@/actions/menu"),
          import("@/actions/categories"),
          import("@/actions/systemConfig"),
        ]);

        const [menuRes, catRes, cfgRes] = await Promise.all([
          getMenus(),
          getCategories(),
          getSystemConfig(),
        ]);

        if (!menuRes?.success || !menuRes.data) throw new Error(menuRes?.error || "โหลดเมนูไม่สำเร็จ");

        const categoryNames = new Map<string, string>();
        if (catRes?.success && catRes.data) {
          (catRes.data as CategoryData[]).forEach((c) => categoryNames.set(c.categoryID, c.categoryName));
        }

        if (cfgRes?.success && cfgRes.data) {
          const cfg = cfgRes.data as any;
          setVatPct(Number(cfg.taxRatePct ?? 7));
          setDefaultPct(Number(cfg.defaultDiscountPct ?? 0));
        }

        const items: MenuItem[] = (menuRes.data as MenuData[]).map((m) => ({
          id: m.menuID,
          name: m.menuName,
          categoryName:
            (Array.isArray(m.categories) && m.categories.length > 0
              ? categoryNames.get(m.categories[0]) ?? m.categories[0]
              : "อื่น ๆ") || "อื่น ๆ",
          price: Number(m.price) || 0,
          discountType: (m.discountType as DiscountType) ?? "THB",
          discountValue: Number(m.discountValue ?? 0),
        }));

        setRows(items.map((item) => ({ ...item, finalPrice: calcFinalPrice(item) })));
      } catch (e: any) {
        toast.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const qq = q.toLowerCase();
    return rows.filter(
      (r) => r.name.toLowerCase().includes(qq) || r.categoryName.toLowerCase().includes(qq)
    );
  }, [q, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateRow = (id: string, patch: Partial<MenuItem>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextType = (patch.discountType ?? r.discountType) as DiscountType | undefined;
        const rawVal =
          patch.discountValue !== undefined ? Number(patch.discountValue) : Number(r.discountValue ?? 0);
        const next: MenuItem = {
          ...r,
          ...patch,
          discountValue: nextType === "%" ? clampPct(rawVal) : nonNeg(rawVal),
        };
        return { ...next, finalPrice: calcFinalPrice(next) } as DiscountRow;
      })
    );
  };

  const applyDefaultDiscountToAll = () => {
    if (!Number.isFinite(defaultPct) || defaultPct < 0) {
      toast.error("กรุณาตั้งค่า 'ส่วนลดเริ่มต้น (%)' ให้ถูกต้อง");
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
      const { updateDiscounts } = await import("@/actions/menu");
      const res = await updateDiscounts(payload as any);
      if (!res?.success) throw new Error(res?.error || "บันทึกไม่สำเร็จ");
      toast.success("บันทึกส่วนลดเรียบร้อย");
    } catch (e: any) {
      toast.error(e?.message || "บันทึกส่วนลดไม่สำเร็จ");
    }
  };

  const handleSaveConfigToServer = async () => {
    try {
      const fd = new FormData();
      fd.append("taxRatePct", String(vatPct));
      fd.append("defaultDiscountPct", String(defaultPct));
      fd.append("currency", "THB");
      const { updateSystemConfig } = await import("@/actions/systemConfig");
      const res = await updateSystemConfig(fd);
      if (!res.success) throw new Error(res.error || "บันทึกค่าไม่สำเร็จ");
      toast.success("บันทึก VAT / Default Discount สำเร็จ");
    } catch (e: any) {
      toast.error(e?.message || "บันทึกค่าไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCE8] p-6 space-y-4">
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

          <label className="text-sm flex items-center gap-2">
            ส่วนลดเริ่มต้น (%)
            <input
              type="number"
              min={0}
              max={100}
              value={defaultPct}
              onChange={(e) => setDefaultPct(clampPct(Number(e.target.value)))}
              className="w-20 border rounded-lg px-2 py-1 text-right"
            />
          </label>

          <label className="text-sm flex items-center gap-2">
            VAT (%)
            <input
              type="number"
              min={0}
              max={100}
              value={vatPct}
              onChange={(e) => setVatPct(clampPct(Number(e.target.value)))}
              className="w-20 border rounded-lg px-2 py-1 text-right"
            />
          </label>

          <button
            onClick={applyDefaultDiscountToAll}
            className="rounded-xl px-3 py-2 border shadow hover:bg-gray-50"
            title="ตั้งส่วนลดของทุกรายการให้เท่ากับค่า Default (%)"
          >
            ใช้ค่า Default (%) ทุกช่อง
          </button>

          <button
            onClick={handleSaveConfigToServer}
            className="rounded-xl px-3 py-2 border shadow hover:bg-gray-50"
            title="บันทึก VAT และ Default Discount ลงฐานข้อมูล"
          >
            บันทึกค่า (ระบบ)
          </button>
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

      <div className="overflow-x-auto">
        <div className="rounded-xl overflow-hidden border-2 border-[#834F2C] shadow">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-[#BF9270] text-white">
              <tr>
                <th className="p-2 text-left w-36">ส่วนลด</th>
                <th className="p-2 text-right w-32">ราคา</th>
                <th className="p-2 text-left">ชื่อสินค้า</th>
                <th className="p-2 text-left w-56">หมวดหมู่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
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
                          onChange={(e) => updateRow(r.id, { discountType: e.target.value as DiscountType })}
                        >
                          <option value="THB">฿</option>
                          <option value="%">%</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          className="border rounded-lg px-2 py-1 w-20 text-right"
                          value={r.discountValue ?? 0}
                          onChange={(e) => updateRow(r.id, { discountValue: Number(e.target.value || 0) })}
                        />
                        <span className="text-xs text-gray-500">→</span>
                        <span className="text-emerald-600 font-semibold">
                          {new Intl.NumberFormat("th-TH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(r.finalPrice)}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      {new Intl.NumberFormat("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(r.price)}
                    </td>
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.categoryName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md px-3 py-1 border"
            disabled={page <= 1}
          >
            ก่อนหน้า
          </button>
          <span>
            หน้า {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md px-3 py-1 border"
            disabled={page >= totalPages}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}

