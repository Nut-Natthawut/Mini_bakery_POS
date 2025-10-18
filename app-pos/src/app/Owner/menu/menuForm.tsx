"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Minus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getMenus } from "@/actions/menu";
import { getCategories } from "@/actions/categories";
import { getSystemConfig } from "@/actions/systemConfig";
import { createOrderWithReceipt } from "@/actions/sales";
import type { MenuData, CategoryData } from "@/types/type";

import generatePromptPay from "promptpay-qr";
import QRCode from "qrcode";

const PROMPTPAY_ID = "0622812753"; // ← เบอร์พร้อมเพย์ของคุณ

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );

/** คำนวณราคาต่อหน่วยหลังส่วนลด (รองรับ THB/% และ default discount จากระบบ) */
const calcFinalUnit = (
  price: number,
  discountType?: "THB" | "%",
  discountValue?: number,
  defaultPct: number = 0
) => {
  const base = Number(price);
  const type = (discountType ?? "THB").toUpperCase();
  const raw = Number(discountValue ?? 0);

  let unit = base;
  if (type === "%") {
    const pct = Math.min(100, Math.max(0, raw));
    unit = base * (1 - pct / 100);
  } else if (type === "THB") {
    unit = base - Math.max(0, raw);
  }

  // ถ้ารายการไม่มีส่วนลด ให้ใช้ defaultDiscountPct ของระบบ
  if ((unit === base || unit >= base) && defaultPct > 0) {
    unit = base * (1 - defaultPct / 100);
  }

  return Math.max(0, round2(unit));
};

type CartItem = {
  id: string;
  name: string;
  price: number;     // ราคาต่อหน่วยหลังลด
  basePrice: number; // ราคาต่อหน่วยก่อนลด
  qty: number;
  image?: string | null;
};

const QUICK_CASH = [1000, 500, 100, 50, 20, 10, 5, 1];
const ENV_POS_USER = process.env.NEXT_PUBLIC_POS_USER_ID;

export default function MenuForm() {
  const [menuItems, setMenuItems] = useState<MenuData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [activeCat, setActiveCat] = useState("all");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<MenuData | null>(null);
  const [qty, setQty] = useState(1);
  const [qtyOpen, setQtyOpen] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<"cash" | "qr">("cash");
  const [paid, setPaid] = useState(0);

  // config จากระบบ
  const [taxPct, setTaxPct] = useState<number>(7);
  const [defaultDiscountPct, setDefaultDiscountPct] = useState<number>(0);

  // QR PromptPay
  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrMaking, setQrMaking] = useState(false);

  const [thanks, setThanks] = useState<{
    total: number;
    discount: number;
    vat: number;
    method: "cash" | "qr";
    change: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [mRes, cRes, cfgRes] = await Promise.all([getMenus(), getCategories(), getSystemConfig()]);

        if (mRes.success && mRes.data) setMenuItems(mRes.data);
        else toast.error(mRes.error || "โหลดเมนูไม่สำเร็จ");

        if (cRes.success && cRes.data) setCategories(cRes.data);
        else toast.error(cRes.error || "โหลดหมวดหมู่ไม่สำเร็จ");

        if (cfgRes?.success && cfgRes.data) {
          setTaxPct(Number(cfgRes.data.taxRatePct ?? 0));
          setDefaultDiscountPct(Number(cfgRes.data.defaultDiscountPct ?? 0));
        }
      } catch (e: any) {
        toast.error(e?.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ถ้า default discount/เมนูเปลี่ยน → ปรับราคาในตะกร้า
  useEffect(() => {
    if (!menuItems.length) return;
    setCart((prev) =>
      prev.map((item) => {
        const menu = menuItems.find((m) => m.menuID === item.id);
        if (!menu) return item;
        const base = Number(menu.price);
        const unit = calcFinalUnit(
          base,
          menu.discountType as any,
          Number(menu.discountValue),
          defaultDiscountPct
        );
        return { ...item, price: unit, basePrice: base };
      })
    );
  }, [defaultDiscountPct, menuItems]);

  // ==== สร้าง QR PromptPay ตามยอดปัจจุบัน ====
  async function buildPromptPayQR(amount: number) {
    try {
      setQrMaking(true);
      const payload = generatePromptPay(PROMPTPAY_ID, { amount: Number(amount || 0) });
      const url = await QRCode.toDataURL(payload, { margin: 1, scale: 6 });
      setQrUrl(url);
    } catch {
      setQrUrl("");
    } finally {
      setQrMaking(false);
    }
  }
  useEffect(() => {
    if (payOpen && method === "qr") buildPromptPayQR(grandTotal);
  }, [payOpen, method, /* regenerate เมื่อยอดเปลี่ยน */ menuItems, cart]);

  const visible = useMemo(() => {
    if (activeCat === "all") return menuItems;
    return menuItems.filter((m) => (m.categories || []).includes(activeCat));
  }, [menuItems, activeCat]);

  // Totals
  const beforeDiscountSubtotal = useMemo(
    () => round2(cart.reduce((sum, line) => sum + round2(line.basePrice) * line.qty, 0)),
    [cart]
  );
  const subtotalAfterDiscount = useMemo(
    () => round2(cart.reduce((sum, line) => sum + round2(line.price) * line.qty, 0)),
    [cart]
  );
  const discountAmount = useMemo(
    () => Math.max(0, round2(beforeDiscountSubtotal - subtotalAfterDiscount)),
    [beforeDiscountSubtotal, subtotalAfterDiscount]
  );
  const vat = useMemo(
    () => round2(subtotalAfterDiscount * (taxPct / 100)),
    [subtotalAfterDiscount, taxPct]
  );
  const grandTotal = useMemo(
    () => round2(subtotalAfterDiscount + vat),
    [subtotalAfterDiscount, vat]
  );
  const itemCount = useMemo(() => cart.reduce((sum, line) => sum + line.qty, 0), [cart]);

  const openMenu = (m: MenuData) => {
    setSelected(m);
    setQty(1);
    setQtyOpen(true);
  };

  const addToCart = () => {
    if (!selected) return;
    const base = Number(selected.price);
    const unit = calcFinalUnit(
      base,
      selected.discountType as any,
      Number(selected.discountValue),
      defaultDiscountPct
    );

    setCart((prev) => {
      const exist = prev.find((line) => line.id === selected.menuID);
      if (exist) {
        return prev.map((line) =>
          line.id === exist.id ? { ...line, qty: line.qty + qty, price: unit, basePrice: base } : line
        );
      }
      return [
        ...prev,
        {
          id: selected.menuID,
          name: selected.menuName,
          price: unit,
          basePrice: base,
          qty,
          image: selected.imageUrl,
        },
      ];
    });

    setQty(1);
    setSelected(null);
    setQtyOpen(false);
  };

  const modQty = (id: string, dir: "inc" | "dec") =>
    setCart((prev) =>
      prev.map((line) =>
        line.id === id
          ? { ...line, qty: Math.max(1, line.qty + (dir === "inc" ? 1 : -1)) }
          : line
      )
    );

  const confirmPay = async () => {
    if (!cart.length) return toast.error("ยังไม่มีสินค้าในตะกร้า");
    if (method === "cash" && paid < grandTotal) return toast.error("จำนวนเงินไม่พอ");

    try {
      const res = await createOrderWithReceipt({
        items: cart.map((line) => ({ menuID: line.id, qty: line.qty, price: line.price })),
        amountPaid: method === "cash" ? paid : grandTotal,
        paymentMethod: method,
        userID: ENV_POS_USER || undefined,
      });

      if (!res.success || !res.data) throw new Error(res.error || "บันทึกไม่สำเร็จ");

      toast.success("บันทึกการขายสำเร็จ");

      const finalTotal = Number(res.data.grandTotal ?? grandTotal);
      const finalVat = Number(res.data.taxAmount ?? vat);
      const finalDiscount = Number(res.data.discountAmount ?? discountAmount);
      const amountPaid = method === "cash" ? paid : finalTotal;

      setCart([]);
      setPaid(0);
      setPayOpen(false);
      setThanks({
        total: finalTotal,
        discount: finalDiscount,
        vat: finalVat,
        method,
        change: Math.max(0, amountPaid - finalTotal),
      });
    } catch (e: any) {
      toast.error(e?.message || "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDE4]">
      <div className="flex">
        <main className="flex-1 p-4 sm:p-6 lg:pr-[380px]">
          {/* หมวดหมู่ */}
          <div className="container mx-auto flex h-14 items-center gap-2 overflow-x-auto">
            <ToggleGroup
              type="single"
              value={activeCat}
              onValueChange={(value) => setActiveCat(value || "all")}
              className="flex gap-2"
            >
              <ToggleGroupItem
                value="all"
                className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border border-[#8B4513]/70 bg-white data-[state=on]:bg-[#8B4513] data-[state=on]:text-white"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 group-data-[state=on]:bg-white" />
                ทั้งหมด
              </ToggleGroupItem>
              {categories.map((c) => (
                <ToggleGroupItem
                  key={c.categoryID}
                  value={c.categoryID}
                  className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border border-[#8B4513]/70 bg-white data-[state=on]:bg-[#8B4513] data-[state=on]:text-white"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[#D9ECD0] group-data-[state=on]:bg-white" />
                  <span className="truncate max-w-[9rem]">{c.categoryName}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* เมนู */}
          <div className="grid gap-5 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr px-1 sm:px-2 mt-3">
            {loading ? (
              <div className="col-span-full flex items-center justify-center h-64 text-gray-500">
                กำลังโหลดข้อมูล...
              </div>
            ) : visible.length === 0 ? (
              <div className="col-span-full flex items-center justify-center h-64 text-gray-400">
                ไม่พบรายการ
              </div>
            ) : (
              visible.map((m) => {
                const base = Number(m.price);
                const unit = calcFinalUnit(
                  base,
                  m.discountType as any,
                  Number(m.discountValue),
                  defaultDiscountPct
                );
                const hasDisc = unit + 0.001 < base;
                const pctOff = base > 0 ? Math.round(((base - unit) / base) * 100) : 0;
                const saving = Math.max(0, round2(base - unit));

                return (
                  <Card
                    key={m.menuID}
                    className="flex flex-col rounded-xl border border-transparent bg-white hover:border-[#E6D5C6] hover:shadow-md transition"
                    onClick={() => openMenu(m)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="mb-3">
                        <div className="relative w-full aspect-square rounded-xl bg-gray-100 overflow-hidden">
                          {hasDisc && pctOff > 0 && (
                            <span className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white shadow">
                              -{pctOff}%
                            </span>
                          )}
                          {m.imageUrl ? (
                            <img src={m.imageUrl} alt={m.menuName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400 text-sm">
                              No image
                            </div>
                          )}
                        </div>
                      </CardTitle>
                      <CardDescription className="text-[16px] line-clamp-2 min-h-[46px]">
                        {m.menuName}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="px-4 pb-4 pt-0 mt-auto">
                      <div className="text-[16px] font-semibold">
                        {hasDisc ? (
                          <>
                            <span className="mr-2 line-through text-gray-400">฿ {fmt(base)}</span>
                            <span className="text-[#198754]">฿ {fmt(unit)}</span>
                          </>
                        ) : (
                          <span className="text-[#111]">฿ {fmt(base)}</span>
                        )}
                      </div>
                      {hasDisc && (
                        <span className="mt-1 block text-xs text-gray-500">
                          ประหยัด ฿ {fmt(saving)}{pctOff > 0 ? ` (${pctOff}%)` : ""}
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </main>

        {/* ตะกร้า */}
        <aside className="fixed top-0 right-0 h-screen w-[360px] bg-white rounded-l-2xl shadow-xl p-4 flex flex-col border-l border-[#eadfce]">
          <div className="bg-[#F7F3EF] rounded-lg shadow-sm mb-3">
            <div className="grid grid-cols-6 gap-2 p-2 text-sm font-semibold">
              <div>No</div>
              <div className="col-span-2">สินค้า</div>
              <div>ราคา</div>
              <div>จำนวน</div>
              <div>ลบ</div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {cart.map((line, idx) => (
              <div
                key={line.id}
                className="grid grid-cols-6 gap-1 p-2 border-b last:border-b-0 text-sm items-center"
              >
                <div>{idx + 1}</div>
                <div className="col-span-2 truncate">{line.name}</div>
                <div className="text-[12.4px]" >฿ {fmt(line.price)}</div>
                <div className="flex items-center gap-1">
                  <button
                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-500 disabled:opacity-50"
                    onClick={() => modQty(line.id, "dec")}
                    disabled={line.qty <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{line.qty}</span>
                  <button
                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-green-600"
                    onClick={() => modQty(line.id, "inc")}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  className="text-gray-500 hover:text-red-500"
                  onClick={() => setCart((prev) => prev.filter((p) => p.id !== line.id))}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {!cart.length && (
              <div className="text-center text-gray-400 py-10">ยังไม่มีสินค้าในตะกร้า</div>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-[#fef6e4] p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>รายการทั้งหมด</span>
              <span>{itemCount} รายการ</span>
            </div>
            <div className="flex justify-between">
              <span>ยอดก่อนลด</span>
              <span>฿ {fmt(beforeDiscountSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>ส่วนลดรวม</span>
              <span>- ฿ {fmt(discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>ยอดหลังลด</span>
              <span>฿ {fmt(subtotalAfterDiscount)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT ({taxPct}%)</span>
              <span>฿ {fmt(vat)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[#B45309]">
              <span>ยอดชำระ</span>
              <span>฿ {fmt(grandTotal)}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <button
              className="rounded-md border px-3 py-2 text-gray-600 hover:bg-gray-100"
              onClick={() => {
                setCart([]);
                setPaid(0);
              }}
            >
              ล้างตะกร้า
            </button>
            <button
              className="rounded-md bg-[#BF9270] px-3 py-2 text-white font-semibold shadow hover:brightness-110 disabled:opacity-50"
              disabled={!cart.length}
              onClick={() => setPayOpen(true)}
            >
              ชำระเงิน
            </button>
          </div>
        </aside>
      </div>

      {/* MODAL: เลือกจำนวน */}
      {qtyOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[400px] max-w-[90vw] rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selected.menuName}</h3>
              <button onClick={() => setQtyOpen(false)}>
                <X />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-2">
              ราคาเดิม ฿ {fmt(Number(selected.price))}
            </p>
            <p className="text-sm text-emerald-600 mb-4">
              ราคาหลังส่วนลด ฿{" "}
              {fmt(
                calcFinalUnit(
                  Number(selected.price),
                  selected.discountType as any,
                  Number(selected.discountValue),
                  defaultDiscountPct
                )
              )}
            </p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
              >
                <Minus />
              </button>
              <span className="text-xl font-semibold">{qty}</span>
              <button
                className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200"
                onClick={() => setQty((value) => value + 1)}
              >
                <Plus />
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="rounded-md bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
                onClick={() => setQtyOpen(false)}
              >
                ปิด
              </button>
              <button
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                onClick={addToCart}
              >
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ชำระเงิน */}
      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[420px] max-w-[90vw] rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-xl font-semibold">ชำระเงิน</h2>
              <button onClick={() => setPayOpen(false)}>✕</button>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 mb-4 text-sm space-y-1">
              <p>ยอดก่อนลด: <span className="text-gray-800">฿ {fmt(beforeDiscountSubtotal)}</span></p>
              <p>ส่วนลดรวม: <span className="text-gray-800">฿ {fmt(discountAmount)}</span></p>
              <p>ยอดหลังลด: <span className="text-gray-800">฿ {fmt(subtotalAfterDiscount)}</span></p>
              <p>VAT ({taxPct}%): <span className="text-gray-800">฿ {fmt(vat)}</span></p>
              <p className="font-semibold text-[#B45309]">
                ยอดชำระ: <span className="ml-1">฿ {fmt(grandTotal)}</span>
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                className={`flex-1 rounded-md px-3 py-2 ${
                  method === "cash" ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
                onClick={() => setMethod("cash")}
              >
                เงินสด
              </button>
              <button
                className={`flex-1 rounded-md px-3 py-2 ${
                  method === "qr" ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
                onClick={() => setMethod("qr")}
              >
                QR
              </button>
            </div>

            {method === "cash" ? (
              <>
                <div className="bg-orange-50 rounded-lg p-3 mb-4 text-sm space-y-1">
                  <p>ลูกค้าจ่าย: <span className="text-red-600">฿ {fmt(paid)}</span></p>
                  <p>เงินทอน: <span className="font-semibold">฿ {fmt(Math.max(0, paid - grandTotal))}</span></p>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {QUICK_CASH.map((amount) => (
                    <button
                      key={amount}
                      className="rounded-md bg-orange-100 px-2 py-2 hover:bg-orange-200 text-sm"
                      onClick={() => setPaid((value) => value + amount)}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button className="rounded-md bg-red-400 px-4 py-2 text-white" onClick={() => setPaid(0)}>
                    ล้าง
                  </button>
                  <div className="flex gap-2">
                    <button className="rounded-md bg-gray-300 px-4 py-2" onClick={() => setPayOpen(false)}>
                      ปิด
                    </button>
                    <button
                      className="rounded-md bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
                      disabled={paid < grandTotal}
                      onClick={confirmPay}
                    >
                      ตกลง
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <p className="mb-2">ยอดชำระ : ฿ {fmt(grandTotal)}</p>

                <div className="mb-3">
                  {qrMaking ? (
                    <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                      กำลังสร้าง…
                    </div>
                  ) : qrUrl ? (
                    <img src={qrUrl} alt={`PromptPay ${PROMPTPAY_ID}`} className="w-40 h-40 rounded-lg border" />
                  ) : (
                    <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                      ไม่มี QR
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    onClick={confirmPay}
                  >
                    เสร็จสิ้น
                  </button>
                  <button
                    className="px-3 py-2 rounded-md border"
                    onClick={() => buildPromptPayQR(grandTotal)}
                    title="สร้าง QR ใหม่"
                  >
                    สร้าง QR ใหม่
                  </button>
                </div>

                {qrUrl && (
                  <a
                    href={qrUrl}
                    download={`promptpay_${grandTotal.toFixed(2)}.png`}
                    className="mt-2 text-sm underline text-gray-600"
                  >
                    ดาวน์โหลด QR
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ขอบคุณ */}
      {thanks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[460px] max-w-[92vw] rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="flex justify-center mb-3">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#134e4a]">ขอบคุณที่อุดหนุน</h3>
            <p className="text-gray-600 mt-1">ชำระเงินสำเร็จ</p>

            <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ส่วนลดรวม</span>
                <span className="font-semibold">฿ {fmt(thanks.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT ({taxPct}%)</span>
                <span className="font-semibold">฿ {fmt(thanks.vat)}</span>
              </div>
              <div className="flex justify-between">
                <span>ยอดสุทธิ</span>
                <span className="font-semibold">฿ {fmt(thanks.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>วิธีชำระ</span>
                <span className="font-semibold">{thanks.method === "cash" ? "เงินสด" : "QR Code"}</span>
              </div>
              {thanks.method === "cash" && (
                <div className="flex justify-between">
                  <span>เงินทอน</span>
                  <span className="font-semibold">฿ {fmt(thanks.change)}</span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-5 py-2 text-white font-semibold hover:bg-emerald-600"
                onClick={() => setThanks(null)}
              >
                ปิด
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">สามารถสั่งซื้อใหม่ได้ทันทีจากหน้านี้</p>
          </div>
        </div>
      )}
    </div>
  );
}