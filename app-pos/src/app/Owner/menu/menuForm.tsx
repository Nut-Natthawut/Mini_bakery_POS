/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Minus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getMenus } from "@/actions/menu";
import { getCategories } from "@/actions/categories";
import { createOrderWithReceipt } from "@/actions/sales";
import type { MenuData, CategoryData } from "@/types/type";

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );


const calcFinal = (price: number, t?: "THB" | "%", v?: number) => {
  const type = t ?? "THB";
  const val = Number(v ?? 0);
  return type === "%"
    ? Math.max(0, Number(price) * (1 - val / 100))
    : Math.max(0, Number(price) - val);
};

type CartItem = { id: string; name: string; price: number; qty: number; image?: string };

/** มีหรือไม่มีก็ได้ — ถ้าไม่ส่ง server จะหา/สร้าง POS user ให้เอง */
const ENV_POS_USER = process.env.NEXT_PUBLIC_POS_USER_ID;

export default function MenuForm() {
  const [menuItems, setMenuItems] = useState<MenuData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]); 
  const [activeCat, setActiveCat] = useState("all");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [sel, setSel] = useState<MenuData | null>(null);
  const [qty, setQty] = useState(1);
  const [qtyOpen, setQtyOpen] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<"cash" | "qr">("cash");
  const [paid, setPaid] = useState(0);

  // Thanks modal
  const [showThanks, setShowThanks] = useState<{
    total: number;
    method: "cash" | "qr";
    change: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [m, c] = await Promise.all([getMenus(), getCategories()]);
        if (m.success && m.data) setMenuItems(m.data);
        else toast.error(m.error || "โหลดเมนูไม่สำเร็จ");
        if (c.success && c.data) setCategories(c.data);
        else toast.error(c.error || "โหลดหมวดหมู่ไม่สำเร็จ");
      } catch (e: any) {
        toast.error(e.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => {
    if (activeCat === "all") return menuItems;
    return menuItems.filter((m) => (m.categories || []).includes(activeCat));
  }, [menuItems, activeCat]);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const onChoose = (m: MenuData) => {
    setSel(m);
    setQty(1);
    setQtyOpen(true);
  };

  const addToCart = () => {
    if (!sel) return;
    setCart((prev) => {
      const f = prev.find((i) => i.id === sel.menuID);
      if (f) return prev.map((i) => (i.id === f.id ? { ...i, qty: i.qty + qty } : i));
      return [
        ...prev,
        {
          id: sel.menuID,
          name: sel.menuName,
          price: Number(sel.price),
          qty,
          image: sel.imageUrl,
        },
      ];
    });
    setQtyOpen(false);
    setSel(null);
  };

  const modQty = (id: string, dir: "inc" | "dec") =>
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, i.qty + (dir === "inc" ? 1 : -1)) } : i
      )
    );
  const delItem = (id: string) => setCart((p) => p.filter((i) => i.id !== id));

  const quick = [1000, 500, 100, 50, 20, 10, 5, 1];

  const confirmPay = async () => {
    if (cart.length === 0) return toast.error("ยังไม่มีสินค้าในตะกร้า");
    if (method === "cash" && paid < total) return toast.error("จำนวนเงินไม่พอ");

    try {
      const res = await createOrderWithReceipt({
        items: cart.map((c) => ({ menuID: c.id, qty: c.qty, price: c.price })),
        amountPaid: method === "cash" ? paid : total,
        paymentMethod: method,
        userID: ENV_POS_USER || undefined,
      });
      if (!res.success || !res.data) throw new Error(res.error || "บันทึกไม่สำเร็จ");

      // show thanks (ไม่ย้ายหน้า)
      toast.success("บันทึกการขายสำเร็จ");
      const change = (method === "cash" ? paid : total) - res.data.grandTotal;
      setPayOpen(false);
      setCart([]);
      setPaid(0);
      setShowThanks({
        total: res.data.grandTotal,
        method,
        change: Math.max(0, change),
      });
    } catch (e: any) {
      toast.error(e.message || "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div className="bg-[#FFFDE4] min-h-screen">
      <div className="flex">
        {/* LEFT */}
        <div className="flex-1 p-4 sm:p-6 lg:pr-[380px]">
          {/* Category chips */}
          <div className="container mx-auto h-[56px] sm:h-[64px] flex items-center px-1 sm:px-2">
            <ToggleGroup
              type="single"
              value={activeCat}
              onValueChange={(v) => setActiveCat(v || "all")}
              className="flex gap-2 sm:gap-3 overflow-x-auto py-1 pr-1"
            >
              <ToggleGroupItem
                value="all"
                className={[
                  "group inline-flex items-center gap-2 rounded-full px-3 sm:px-4 h-8 sm:h-9 text-sm font-semibold transition",
                  "border border-[#8B4513]/70 shadow-sm",
                  "bg-white text-[#3c2a1e]",
                  "data-[state=on]:bg-[#8B4513] data-[state=on]:text-white",
                  "hover:bg-[#8B4513]/10 data-[state=on]:hover:bg-[#8B4513]",
                ].join(" ")}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400/90 group-data-[state=on]:bg-white" />
                All
              </ToggleGroupItem>

              {categories.map((c) => (
                <ToggleGroupItem
                  key={c.categoryID}
                  value={c.categoryID}
                  className={[
                    "group inline-flex items-center gap-2 rounded-full px-3 sm:px-4 h-8 sm:h-9 text-sm font-semibold transition",
                    "border border-[#8B4513]/70 shadow-sm",
                    "bg-white text-[#3c2a1e]",
                    "data-[state=on]:bg-[#8B4513] data-[state=on]:text-white",
                    "hover:bg-[#8B4513]/10 data-[state=on]:hover:bg-[#8B4513]",
                  ].join(" ")}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[#D9ECD0] group-data-[state=on]:bg-white" />
                  <span className="truncate max-w-[9rem]">{c.categoryName}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Menu Grid — ขยาย ~20% โดยลดคอลัมน์รวม */}
          <div
            className="
              grid gap-5
              grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
              auto-rows-fr
              px-1 sm:px-2 mt-3
            "
          >
            {loading ? (
              <div className="col-span-full flex justify-center items-center h-64">
                กำลังโหลดข้อมูล...
              </div>
            ) : visible.length === 0 ? (
              <div className="col-span-full flex justify-center items-center h-64 text-gray-500">
                ยังไม่มีเมนู
              </div>
            ) : (
              visible.map((m) => (
                <Card
                  key={m.menuID}
                  className="flex flex-col rounded-xl border border-transparent bg-white hover:border-[#E6D5C6] hover:shadow-md transition"
                  onClick={() => onChoose(m)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="mb-3">
                      <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        {m.imageUrl ? (
                          <img src={m.imageUrl} alt={m.menuName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            รูปภาพ
                          </div>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription className="text-[16px] line-clamp-2 min-h-[46px]">
                      {m.menuName}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="px-4 pb-4 pt-0 mt-auto">
                    <p className="text-[16px] font-semibold">
                        {m.discountValue && Number(m.discountValue) > 0 ? (
                          <>
                            <span className="line-through text-gray-400 mr-1">฿ {fmt(Number(m.price))}</span>
                            <span className="text-[#198754]">
                              ฿ {fmt(
                                calcFinal(Number(m.price), m.discountType as any, Number(m.discountValue))
                              )}
                           </span>
                         </>
                      ) : (
                        <span className="text-[#111]">฿ {fmt(Number(m.price))}</span>
                      )}
                    </p>

                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* RIGHT CART */}
        <aside className="fixed top-0 right-0 h-screen w-[360px] bg-white rounded-l-2xl shadow-xl p-4 flex flex-col border-l border-[#eadfce]">
          <div className="bg-[#F7F3EF] rounded-lg shadow-sm mb-3">
            <div className="text-[15px] grid grid-cols-6 w-full h-[48px] gap-2 p-2 font-semibold items-center">
              <div>No</div>
              <div className="col-span-2">สินค้า</div>
              <div>ราคา</div>
              <div>จำนวน</div>
              <div>ลบ</div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {cart.map((it, idx) => (
              <div key={it.id} className="grid grid-cols-6 gap-2 p-2 border-b last:border-b-0 text-sm items-center">
                <div>{idx + 1}</div>
                <div className="col-span-2 truncate">{it.name}</div>
                <div>{fmt(it.price)} ฿</div>
                <div className="flex items-center gap-1">
                  <button
                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-500 disabled:opacity-50"
                    onClick={() => modQty(it.id, "dec")}
                    disabled={it.qty <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{it.qty}</span>
                  <button
                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-green-500"
                    onClick={() => modQty(it.id, "inc")}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div>
                  <button className="text-red-500 hover:text-red-700" onClick={() => delItem(it.id)}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto flex justify-between items-center pt-4 border-t">
            <span className="font-bold">รายการ: {count}</span>
            <button
              onClick={() => {
                if (cart.length === 0) return toast.error("ยังไม่มีสินค้าในตะกร้า");
                setPaid(0);
                setMethod("cash");
                setPayOpen(true);
              }}
              className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 transition-colors"
            >
              ดำเนินการต่อ
            </button>
          </div>
        </aside>
      </div>

      {/* QTY MODAL */}
      {qtyOpen && sel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-2xl w-[720px] max-w-[92vw] shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-bold">เพิ่มรายการ</h2>
              <button onClick={() => setQtyOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-56 aspect-square bg-gray-100 rounded-xl overflow-hidden">
                {sel.imageUrl ? (
                  <img src={sel.imageUrl} alt={sel.menuName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">รูปภาพ</div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-xl font-medium mb-2">{sel.menuName}</p>
                <p className="text-lg text-gray-700 mb-6">฿ {fmt(Number(sel.price))}</p>

                <div>
                  <div className="text-lg">จำนวน</div>
                  <div className="flex items-center mt-3">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="mx-4 font-semibold text-lg">{qty}</span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="mt-5 bg-orange-100 rounded-lg p-3 text-lg">
                    ราคาขาย : <span className="font-semibold">฿ {fmt(Number(sel.price) * qty)}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button className="w-[90px] h-[44px] bg-gray-300 rounded-md hover:bg-gray-400" onClick={() => setQtyOpen(false)}>
                    ปิด
                  </button>
                  <button className="w-[90px] h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={addToCart}>
                    ตกลง
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAY MODAL */}
      {payOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[420px] p-5 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-xl font-bold">จ่ายเงิน</h2>
              <button onClick={() => setPayOpen(false)}>✕</button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                className={`flex-1 py-2 rounded-md ${method === "cash" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                onClick={() => setMethod("cash")}
              >
                เงินสด
              </button>
              <button
                className={`flex-1 py-2 rounded-md ${method === "qr" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                onClick={() => setMethod("qr")}
              >
                QR
              </button>
            </div>

            {method === "cash" ? (
              <>
                <div className="bg-orange-50 rounded p-3 mb-4 text-sm space-y-2">
                  <p>ยอดชำระ : <span className="text-red-600">฿ {fmt(total)}</span></p>
                  <p>ลูกค้าจ่าย : <span className="text-red-600">฿ {fmt(paid)}</span></p>
                  <p>เงินทอน : <span className="font-bold">฿ {fmt(Math.max(0, paid - total))}</span></p>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {quick.map((v) => (
                    <button key={v} className="py-2 rounded-md bg-orange-100 hover:bg-orange-200" onClick={() => setPaid((p) => p + v)}>
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button className="bg-red-400 text-white px-4 py-2 rounded-md" onClick={() => setPaid(0)}>
                    ล้าง
                  </button>
                  <div className="flex gap-2">
                    <button className="bg-gray-300 px-4 py-2 rounded-md" onClick={() => setPayOpen(false)}>
                      ปิด
                    </button>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={confirmPay}
                      disabled={paid < total}
                    >
                      ตกลง
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <p className="mb-2">ยอดชำระ : ฿ {fmt(total)}</p>
                <div className="w-40 h-40 bg-gray-200 flex items-center justify-center mb-4 rounded-lg">QR Code</div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" onClick={confirmPay}>
                  เสร็จสิ้น
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* THANKS MODAL (หลังจ่าย) */}
      {showThanks && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl w-[460px] max-w-[92vw] p-6 shadow-2xl text-center">
            <div className="flex justify-center mb-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#134e4a]">ขอบคุณที่อุดหนุน</h3>
            <p className="text-gray-600 mt-1">ชำระเงินสำเร็จ</p>

            <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span>ยอดสุทธิ</span>
                <span className="font-semibold">฿ {fmt(showThanks.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>วิธีชำระ</span>
                <span className="font-semibold">
                  {showThanks.method === "cash" ? "เงินสด" : "QR Code"}
                </span>
              </div>
              {showThanks.method === "cash" && (
                <div className="flex justify-between">
                  <span>เงินทอน</span>
                  <span className="font-semibold">฿ {fmt(showThanks.change)}</span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowThanks(null)}
                className="inline-flex items-center justify-center px-5 py-2 rounded-md bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
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
