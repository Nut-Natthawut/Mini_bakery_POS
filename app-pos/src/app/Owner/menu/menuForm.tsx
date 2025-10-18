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

    /** ==== CONFIG ==== */
    const TAX_RATE = 0.07; // VAT 7% ตายตัว

    /** ==== Utils ==== */
    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
    const fmt = (n: number) =>
      new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        Number(n || 0)
      );

    /** ราคาหลังส่วนลดต่อหน่วย (รองรับ THB / %) */
    const calcFinalUnit = (price: number, t?: "THB" | "%", v?: number) => {
      const type = t ?? "THB";
      const raw = Number(v ?? 0);
      if (type === "%") {
        const pct = Math.min(100, Math.max(0, raw));
        return Math.max(0, round2(Number(price) * (1 - pct / 100)));
      }
      return Math.max(0, round2(Number(price) - Math.max(0, raw)));
    };

    // เก็บทั้งราคาหลังลดต่อหน่วย (price) และ "ราคาก่อนลด" (basePrice)
    type CartItem = {
      id: string;
      name: string;
      price: number;     // final unit (หลังส่วนลด)
      basePrice: number; // base unit (ก่อนส่วนลด)
      qty: number;
      image?: string;
    };

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
        discount: number;
        vat: number;
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

      /** ===== Totals =====
       * baseSubtotal = ผลรวม "ก่อนลด"
       * subtotalAfterDiscount = ผลรวม "หลังลด"
       * discountAmount = ส่วนลดรวม
       * vat = 7% จากยอดหลังลด
       * grandTotal = หลังลด + VAT
       */
      const beforeDiscountSubtotal = useMemo(
        () => round2(cart.reduce((s, i) => s + round2(i.basePrice) * i.qty, 0)),
        [cart]
      );
      const subtotalAfterDiscount = useMemo(
        () => round2(cart.reduce((s, i) => s + round2(i.price) * i.qty, 0)),
        [cart]
      );
      const discountAmount = useMemo(
        () => Math.max(0, round2(beforeDiscountSubtotal - subtotalAfterDiscount)),
        [beforeDiscountSubtotal, subtotalAfterDiscount]
      );
      const vat = useMemo(() => round2(subtotalAfterDiscount * TAX_RATE), [subtotalAfterDiscount]);
      const grandTotal = useMemo(() => round2(subtotalAfterDiscount + vat), [subtotalAfterDiscount, vat]);
      const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

      const onChoose = (m: MenuData) => {
        setSel(m);
        setQty(1);
        setQtyOpen(true);
      };

      const addToCart = () => {
        if (!sel) return;
        const base = Number(sel.price);
        const finalUnit = calcFinalUnit(base, sel.discountType as any, Number(sel.discountValue));

        setCart((prev) => {
          const f = prev.find((i) => i.id === sel.menuID);
          if (f) {
            return prev.map((i) =>
              i.id === f.id ? { ...i, qty: i.qty + qty } : i
            );
          }
          return [
            ...prev,
            {
              id: sel.menuID,
              name: sel.menuName,
              price: finalUnit, // หลังลดต่อหน่วย
              basePrice: base,  // ก่อนลดต่อหน่วย
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
        if (method === "cash" && paid < grandTotal) return toast.error("จำนวนเงินไม่พอ");

        // เก็บตัวเลข ณ ขณะกดชำระ (ป้องกันหายหลังเคลียร์ตะกร้า)
        const snap = {
          discount: discountAmount,
          vat,
          total: grandTotal,
        };

        try {
          // ส่งราคาเป็น "หลังส่วนลดต่อหน่วย" ไปที่ server
          const res = await createOrderWithReceipt({
            items: cart.map((c) => ({ menuID: c.id, qty: c.qty, price: c.price })), // price = final unit
            amountPaid: method === "cash" ? paid : grandTotal, // QR จ่ายพอดี grand total
            paymentMethod: method,
            userID: ENV_POS_USER || undefined,
          });
          if (!res.success || !res.data) throw new Error(res.error || "บันทึกไม่สำเร็จ");

          toast.success("บันทึกการขายสำเร็จ");

          // ใช้ค่าจาก server ถ้ามี ไม่งั้น fallback เป็น snapshot ข้างบน
          const serverTotal = Number(res.data.grandTotal ?? snap.total);
          const serverVat = Number(res.data.taxAmount ?? snap.vat);
          const serverDiscount = Number(res.data.discountAmount ?? snap.discount);

          const change = (method === "cash" ? paid : serverTotal) - serverTotal;

          const prefer = (serverVal: any, localVal: number) => {
        const n = Number(serverVal);
        return Number.isFinite(n) && n > 0 ? n : localVal;
      };

        const finalTotal = Number(res.data.grandTotal ?? snap.total);
        const finalVat = prefer(res.data.taxAmount, snap.vat);
        const finalDiscount = prefer(res.data.discountAmount, snap.discount);

        const amountPaid = method === "cash" ? paid : finalTotal;
        const changeAmount = Math.max(0, amountPaid - finalTotal);

        setPayOpen(false);
        setCart([]);
        setPaid(0);
        setShowThanks({
          total: finalTotal,
          vat: finalVat,
          discount: finalDiscount,
          method,
          change: changeAmount,
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

              {/* Menu Grid */}
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
                  visible.map((m) => {
                    const base = Number(m.price);
                    const finalUnit = calcFinalUnit(base, m.discountType as any, Number(m.discountValue));
                    const hasDisc = Number(m.discountValue ?? 0) > 0;
                    return (
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
                            {hasDisc ? (
                              <>
                                <span className="line-through text-gray-400 mr-1">฿ {fmt(base)}</span>
                                <span className="text-[#198754]">฿ {fmt(finalUnit)}</span>
                              </>
                            ) : (
                              <span className="text-[#111]">฿ {fmt(base)}</span>
                            )}
                          </p>
                        </CardFooter>
                      </Card>
                    );
                  })
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

              {/* Summary (ก่อน/หลังลด + VAT 7%) */}
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>ยอดก่อนลด</span>
                  <span>฿ {fmt(beforeDiscountSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ส่วนลดรวม</span>
                  <span>฿ {fmt(discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal (หลังส่วนลด)</span>
                  <span>฿ {fmt(subtotalAfterDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT </span>
                  <span>฿ {fmt(vat)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t">
                  <span>Grand Total</span>
                  <span>฿ {fmt(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center pt-3 border-t">
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

                    <div className="text-lg mb-6">
                      {Number(sel.discountValue ?? 0) > 0 ? (
                        <>
                          <span className="line-through text-gray-400 mr-2">
                            ฿ {fmt(Number(sel.price))}
                          </span>
                          <span className="text-emerald-600 font-semibold">
                            ฿ {fmt(calcFinalUnit(Number(sel.price), sel.discountType as any, Number(sel.discountValue)))}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-800 font-semibold">
                          ฿ {fmt(Number(sel.price))}
                        </span>
                      )}
                    </div>

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
                        ราคาขาย :
                        <span className="font-semibold ml-1">
                          ฿ {fmt(
                            calcFinalUnit(Number(sel.price), sel.discountType as any, Number(sel.discountValue)) * qty
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        className="w-[90px] h-[44px] bg-gray-300 rounded-md hover:bg-gray-400"
                        onClick={() => setQtyOpen(false)}
                      >
                        ปิด
                      </button>
                      <button
                        className="w-[90px] h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        onClick={addToCart}
                      >
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

                <div className="bg-orange-50 rounded p-3 mb-4 text-sm space-y-1">
                  <p>ยอดก่อนลด: <span className="text-gray-800">฿ {fmt(beforeDiscountSubtotal)}</span></p>
                  <p>ส่วนลดรวม: <span className="text-gray-800">฿ {fmt(discountAmount)}</span></p>
                  <p>Subtotal (หลังส่วนลด): <span className="text-gray-800">฿ {fmt(subtotalAfterDiscount)}</span></p>
                  <p>VAT (7%): <span className="text-gray-800">฿ {fmt(vat)}</span></p>
                  <p>ยอดชำระ: <span className="text-red-600 font-semibold">฿ {fmt(grandTotal)}</span></p>
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
                      <p>ลูกค้าจ่าย : <span className="text-red-600">฿ {fmt(paid)}</span></p>
                      <p>เงินทอน : <span className="font-bold">฿ {fmt(Math.max(0, paid - grandTotal))}</span></p>
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
                          disabled={paid < grandTotal}
                        >
                          ตกลง
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <p className="mb-2">ยอดชำระ : ฿ {fmt(grandTotal)}</p>
                    <div className="w-40 h-40 bg-gray-200 flex items-center justify-center mb-4 rounded-lg">QR Code</div>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" onClick={confirmPay}>
                      เสร็จสิ้น
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* THANKS MODAL */}
          {showThanks && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
              <div className="bg-white rounded-2xl w-[460px] max-w-[92vw] p-6 shadow-2xl text-center">
                <div className="flex justify-center mb-3">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-[#134e4a]">ขอบคุณที่อุดหนุน</h3>
                <p className="text-gray-600 mt-1">ชำระเงินสำเร็จ</p>

                {/* แสดง ส่วนลดรวม + VAT + ยอดสุทธิ ตามที่ต้องการ */}
                <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-left space-y-2">
                  <div className="flex justify-between">
                    <span>ส่วนลดรวม</span>
                    <span className="font-semibold">฿ {fmt(showThanks.discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (7%)</span>
                    <span className="font-semibold">฿ {fmt(showThanks.vat)}</span>
                  </div>
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
