/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Minus, Plus as PlusIcon } from "lucide-react";
import { MenuData, CategoryData } from "@/types/type";
import { getMenus } from "@/actions/menu";
import { getCategories } from "@/actions/categories";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

/* ---------- Cash / QR Payment ---------- */
const CashPayment = ({ total, onClose }: { total: number; onClose: () => void }) => {
  const [paid, setPaid] = useState(0);
  const change = paid - total;
  const buttons = [1000, 500, 100, 50, 20, 10, 5, 1];
  return (
    <div>
      <div className="bg-orange-50 rounded p-3 mb-4 text-sm space-y-2">
        <p>ยอดเงินที่ต้องชำระ : <span className="text-red-600">{total}</span></p>
        <p>ลูกค้าจ่าย : <span className="text-red-600">{paid}</span></p>
        <p>เงินทอน : <span className="font-bold">{change >= 0 ? change : 0}</span></p>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {buttons.map((val) => (
          <button
            key={val}
            className="py-2 rounded-md bg-orange-100 hover:bg-orange-200"
            onClick={() => setPaid((p) => p + val)}
          >
            {val}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <button className="bg-red-400 text-white px-4 py-2 rounded-md" onClick={() => setPaid(0)}>ล้าง</button>
        <div className="flex gap-2">
          <button className="bg-gray-300 px-4 py-2 rounded-md" onClick={onClose}>ปิด</button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md">ตกลง</button>
        </div>
      </div>
    </div>
  );
};

const QrPayment = ({ total, onClose }: { total: number; onClose: () => void }) => {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-2">ยอดชำระ : {total} บาท</p>
      <div className="w-40 h-40 bg-gray-200 flex items-center justify-center mb-4">QR Code</div>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={onClose}>เสร็จสิ้น</button>
    </div>
  );
};

/* ---------- Main ---------- */
const MenuForm = () => {
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<"cash" | "qr">("cash");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<MenuData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const [m, c] = await Promise.all([getMenus(), getCategories()]);
        if (m.success && m.data) setMenuItems(m.data);
        else toast.error(m.error || "ไม่สามารถโหลดข้อมูลเมนูได้");

        if (c.success && c.data) setCategories(c.data);
        else toast.error(c.error || "ไม่สามารถโหลดหมวดหมู่ได้");
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleCardClick = (item: MenuData) => {
    setSelectedItem(item);
    setQuantity(1);
    setIsModalOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    setCartItems((prev) => {
      const exist = prev.find((i) => i.id === selectedItem.menuID);
      if (exist) {
        return prev.map((i) =>
          i.id === selectedItem.menuID ? { ...i, qty: i.qty + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: selectedItem.menuID!,
          name: selectedItem.menuName,
          price: selectedItem.price,
          qty: quantity,
          image: selectedItem.imageUrl,
        },
      ];
    });
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleRemoveItem = (id: string) =>
    setCartItems((prev) => prev.filter((i) => i.id !== id));

  const increaseQuantity = () => setQuantity((p) => p + 1);
  const decreaseQuantity = () => setQuantity((p) => (p > 1 ? p - 1 : p));

  const handleUpdateQty = (id: string, action: "increase" | "decrease") => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (action === "increase") return { ...item, qty: item.qty + 1 };
        if (action === "decrease" && item.qty > 1) return { ...item, qty: item.qty - 1 };
        return item;
      })
    );
  };

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );
  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems]
  );

  const visibleMenus = useMemo(() => {
    if (activeCat === "all") return menuItems;
    return menuItems.filter((m) => (m.categories || []).includes(activeCat));
  }, [menuItems, activeCat]);

  return (
    <>
      <div className="item-center justify-center bg-[#FFFDE4] ">
        <div className="flex">
          {/* Left side */}
          <div className="flex-1 p-6">
            <header className="w-full">
              <div className="container mx-auto px-6 h-[70px] flex items-center justify-between">
                {/* --- Category Chips (UI ใหม่) --- */}
                <ToggleGroup
                  type="single"
                  value={activeCat}
                  onValueChange={(v) => setActiveCat(v || "all")}
                  className="flex gap-3 overflow-x-auto py-1 pr-1"
                >
                  <ToggleGroupItem
                    value="all"
                    aria-label="All"
                    className={[
                      "group inline-flex items-center gap-2 rounded-full px-4 h-9 text-sm font-semibold transition",
                      "border border-[#8B4513]/70 shadow-sm",
                      "bg-white text-[#3c2a1e]",
                      "data-[state=on]:bg-[#8B4513] data-[state=on]:text-white",
                      "hover:bg-[#8B4513]/10 data-[state=on]:hover:bg-[#8B4513]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B4513]/40",
                    ].join(" ")}
                  >
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400/90 group-data-[state=on]:bg-white" />
                    All
                  </ToggleGroupItem>

                  {categories.map((cat) => (
                    <ToggleGroupItem
                      key={cat.categoryID}
                      value={cat.categoryID}
                      aria-label={cat.categoryName}
                      className={[
                        "group inline-flex items-center gap-2 rounded-full px-4 h-9 text-sm font-semibold transition",
                        "border border-[#8B4513]/70 shadow-sm",
                        "bg-white text-[#3c2a1e]",
                        "data-[state=on]:bg-[#8B4513] data-[state=on]:text-white",
                        "hover:bg-[#8B4513]/10 data-[state=on]:hover:bg-[#8B4513]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B4513]/40",
                      ].join(" ")}
                    >
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D9ECD0] group-data-[state=on]:bg-white" />
                      <span className="truncate max-w-[9rem]">{cat.categoryName}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </header>

            {/* Menu cards */}
            <aside className="grid grid-cols-3 gap-10 p-6 mx-5">
              {isLoading ? (
                <div className="col-span-3 flex justify-center items-center h-64">
                  <div className="text-lg">กำลังโหลดข้อมูล...</div>
                </div>
              ) : visibleMenus.length === 0 ? (
                <div className="col-span-3 flex flex-col justify-center items-center h-64">
                  <div className="text-lg text-gray-500 mb-4">ยังไม่มีเมนู</div>
                </div>
              ) : (
                visibleMenus.map((item) => (
                  <Card
                    key={item.menuID}
                    className="w-[219px] h-[300px] border-none bg-white cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCardClick(item)}
                  >
                    <CardHeader>
                      <CardTitle>
                        <div className="w-[180px] h-[180px] bg-gray-200 ml-[-4px] mb-2 rounded-md flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.menuName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500">รูปภาพ</span>
                          )}
                        </div>
                      </CardTitle>
                      <CardDescription className="my-1">{item.menuName}</CardDescription>
                    </CardHeader>
                    <CardFooter className="ml-[100px]">
                      <p className="text-[#000000] font-medium">{item.price} THB</p>
                    </CardFooter>
                  </Card>
                ))
              )}
            </aside>
          </div>
        </div>

        {/* Right cart panel */}
        <div className="fixed top-0 right-0 h-screen w-[350px] bg-white rounded-l-lg shadow-lg p-4 flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="border-none rounded-lg">
              <div className="bg-[#F1E9E5] border-none  rounded-md shadow-md mb-4">
                <div className="text-[16px] grid grid-cols-6 w-[317px] h-[69px] gap-2 p-2 text-sm font-semibold justify-center items-center ">
                  <div>No</div>
                  <div className="col-span-2">สินค้า</div>
                  <div>ราคา</div>
                  <div>จำนวน</div>
                  <div>ลบ</div>
                </div>
              </div>
              <div>
                {cartItems.map((cartItem, i) => (
                  <div
                    key={cartItem.id}
                    className="grid grid-cols-6 gap-2 p-2 border-b last:border-b-0 text-sm items-center"
                  >
                    <div>{i + 1}</div>
                    <div className="col-span-2 truncate">{cartItem.name}</div>
                    <div>{cartItem.price} ฿</div>
                    <div className="flex items-center gap-1">
                      <button
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-500 disabled:opacity-50"
                        onClick={() => handleUpdateQty(cartItem.id, "decrease")}
                        disabled={cartItem.qty <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{cartItem.qty}</span>
                      <button
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-green-500"
                        onClick={() => handleUpdateQty(cartItem.id, "increase")}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveItem(cartItem.id)}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto flex justify-between items-center pt-4 border-t">
            <span className="font-bold">รายการ: {totalItems}</span>
            <button
              onClick={() => setIsPayOpen(true)}
              className="bg-green-200 px-4 py-2 rounded-md hover:bg-green-300 transition-colors"
            >
              ดำเนินการต่อ
            </button>
          </div>
        </div>

        {/* Quantity modal */}
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
            <div className="bg-white p-[20px] rounded-lg w-[711px] h-[468px] mx-4 overflow-hidden ">
              <div className="flex justify-between items-center p-4 ">
                <h2 className="text-lg text-[32px] font-bold">Menu</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 mb-[-20px]  flex justify-space-between ">
                <div className="min-w-[300px]  bg-white rounded-lg p-4 ">
                  <p className="text-[20px] font-medium text-black mb-[25px]">
                    {selectedItem.menuName} {selectedItem.price} บาท
                  </p>
                  <div className="flex w-[200px] h-[200px] bg-gray-200 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                    {selectedItem.imageUrl ? (
                      <img
                        src={selectedItem.imageUrl}
                        alt={selectedItem.menuName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">รูปภาพ</span>
                    )}
                  </div>
                </div>

                <div className="p-4 ml-[-60px] mt-[40px]">
                  <div className=" items-center mb-[50px]">
                    <span className="text-[20px]">จำนวน</span>
                    <div className="flex items-center mt-[20px]">
                      <button
                        onClick={decreaseQuantity}
                        className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                        disabled={quantity <= 1}
                      >
                        <Minus size={20} />
                      </button>
                      <span className="mx-4 font-semibold">{quantity}</span>
                      <button
                        onClick={increaseQuantity}
                        className="w-8 h-8 rounded-full bg-green-100 text-green-500 flex items-center justify-center hover:bg-green-200"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="w-[393px] bg-orange-200 rounded-lg p-3 mb-4 text-[20px]">
                    <span className="font-medium text-black ml-[20px]">
                      ราคาขาย : {selectedItem.price * quantity}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-row gap-3">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-[90px] h-[50px] bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-[20px]"
                  >
                    ปิด
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="w-[90px] h-[50px] bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors text-[20px]"
                  >
                    ตกลง
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pay modal */}
        {isPayOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[400px] p-5">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-xl font-bold border-none">จ่ายเงิน</h2>
                <button onClick={() => setIsPayOpen(false)}>✕</button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 py-2 rounded-md ${payMethod === "cash" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                  onClick={() => setPayMethod("cash")}
                >
                  เงินสด
                </button>
                <button
                  className={`flex-1 py-2 rounded-md ${payMethod === "qr" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                  onClick={() => setPayMethod("qr")}
                >
                  QR
                </button>
              </div>

              {payMethod === "cash" ? (
                <CashPayment total={totalPrice} onClose={() => setIsPayOpen(false)} />
              ) : (
                <QrPayment total={totalPrice} onClose={() => setIsPayOpen(false)} />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MenuForm;
