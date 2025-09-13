"use client"
import React, { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, Plus, Minus } from 'lucide-react';

//  สร้าง Type สำหรับข้อมูลรายการเมนูและตะกร้าสินค้า
interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

const MenuForm = () => {
  //  ระบุ Type ให้กับ useState
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: 1, name: "เค้กช็อกโกแลต", price: 199, qty: 1 },
    { id: 2, name: "คุกกี้", price: 99, qty: 2 },
  ]);

  // ✅ ระบุ Type ให้กับ selectedItem (สามารถเป็น MenuItem หรือ null)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const menuItems: MenuItem[] = [
    { id: 1, name: "เค้กช็อกโกแลต", price: 199, image: "" },
    { id: 2, name: "คุกกี้ช็อกชิป", price: 150, image: "" },
    { id: 3, name: "แอปเปิ้ลพาย", price: 180, image: "" },
    { id: 4, name: "ขนมปังเนยสด", price: 120, image: "" },
  ];

  const handleCardClick = (item: MenuItem) => { //  ระบุ Type ของ item
    setSelectedItem(item);
    setQuantity(1);
    setIsModalOpen(true);
  };

  const handleAddToCart = () => {
    //  เพิ่มการตรวจสอบ selectedItem.id ก่อนใช้งาน
    if (!selectedItem) return;

    const existingItem = cartItems.find(cartItem => cartItem.id === selectedItem.id);

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === selectedItem.id
          ? { ...item, qty: item.qty + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.price,
        qty: quantity
      }]);
    }

    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleRemoveItem = (id: number) => { //  ระบุ Type ของ id
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleUpdateQty = (id: number, action: 'increase' | 'decrease') => {
  setCartItems(cartItems.map(item => {
    if (item.id === id) {
      if (action === 'increase') {
        return { ...item, qty: item.qty + 1 };
      }
      if (action === 'decrease' && item.qty > 1) {
        return { ...item, qty: item.qty - 1 };
      }
    }
    return item;
  }));
};
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <div className="item-center justify-center">
        <div className="flex">
          {/* ฝั่งซ้าย = เนื้อหา */}
          <div className="flex-1 p-6">
            <header className="w-full">
              <div className="container mx-auto px-6 h-[70px] flex items-center justify-center">
                <ToggleGroup type="multiple" variant="outline" className="flex gap-2">
                  {["All", "Cake", "Cookie", "Pie", "Bread"].map((item) => (
                    <ToggleGroupItem
                      key={item.toLowerCase()}
                      value={item.toLowerCase()}
                      aria-label={`Toggle ${item}`}
                      className="group w-[111px] h-[35px] rounded-full border-2 border-[#8B4513] 
                        data-[state=on]:bg-white hover:bg-white hover:text-[#8B4513]"
                    >
                      <div className="font-bold relative flex items-center pl-2">
                        <div className="w-5 h-5 rounded-full bg-[#D9ECD0] group-data-[state=on]:bg-green-500"></div>
                        <span className="ml-2">{item}</span>
                      </div>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </header>

            {/* content หลัก (card menu) */}
            <aside className="grid grid-cols-3 gap-10 p-6 mx-5">
              {menuItems.map((item) => (
                <Card
                  key={item.id}
                  className="w-[219px] h-[300px] bg-white cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCardClick(item)}
                >
                  <CardHeader>
                    <CardTitle>
                      <div className="w-[180px] h-[180px] bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-500">รูปภาพ</span>
                      </div>
                    </CardTitle>
                    <CardDescription className="my-1">{item.name}</CardDescription>
                  </CardHeader>
                  <CardFooter className="ml-[100px]">
                    <p className="text-[#8B4513] font-bold">{item.price} THB</p>
                  </CardFooter>
                </Card>
              ))}
            </aside>
          </div>
        </div>

        {/* ฝั่งขวา = Cart */}
        <div className="fixed top-0 right-0 h-screen w-[350px] bg-white rounded-l-lg shadow-lg p-4 flex flex-col">
          {/* ส่วน table */}
          <div className="flex-1 overflow-auto">
            <div className="border rounded-lg">
              <div className="bg-gray-50 border-b">
                <div className="grid grid-cols-6 gap-2 p-2 text-sm font-semibold"> {/* ⚠️ เปลี่ยนเป็น 6 คอลัมน์ */}
                  <div>No</div>
                  <div className="col-span-2">สินค้า</div> {/* ⚠️ ใช้ col-span-2 */}
                  <div>ราคา</div>
                  <div>จำนวน</div>
                  <div>ลบ</div>
                </div>
              </div>
              <div>
                {cartItems.map((cartItem, i) => (
                  <div key={cartItem.id} className="grid grid-cols-6 gap-2 p-2 border-b last:border-b-0 text-sm items-center">
                    <div>{i + 1}</div>
                    <div className="col-span-2 truncate">{cartItem.name}</div>
                    <div>{cartItem.price} ฿</div>
                    <div className="flex items-center gap-1">
                      {/*  ปุ่มลดจำนวน */}
                      <button
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-500 disabled:opacity-50"
                        onClick={() => handleUpdateQty(cartItem.id, 'decrease')}
                        disabled={cartItem.qty <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{cartItem.qty}</span>
                      {/*  ปุ่มเพิ่มจำนวน */}
                      <button
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-green-500"
                        onClick={() => handleUpdateQty(cartItem.id, 'increase')}
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

          {/* footer ชิดล่าง */}
          <div className="mt-auto flex justify-between items-center pt-4 border-t">
            <span className="font-bold">รายการ: {totalItems}</span>
            <button className="bg-green-200 px-4 py-2 rounded-md hover:bg-green-300 transition-colors">
              ดำเนินการต่อ
            </button>
          </div>
        </div>

        {/* Modal แบบใหม่ตามรูป */}
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[300px] max-w-[90vw] mx-4 overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-bold">Menu</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  {selectedItem.name} {selectedItem.price} บาท
                </p>

                {/* Product Image */}
                <div className="w-full h-32 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">รูปภาพ</span>
                </div>

                {/* Quantity and Price Section */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm">จำนวน</span>
                  <div className="flex items-center">
                    <button
                      onClick={decreaseQuantity}
                      className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="mx-4 font-semibold">{quantity}</span>
                    <button
                      onClick={increaseQuantity}
                      className="w-8 h-8 rounded-full bg-green-100 text-green-500 flex items-center justify-center hover:bg-green-200"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Total Price Bar */}
                <div className="bg-orange-200 rounded-lg p-3 mb-4 text-center">
                  <span className="font-semibold text-orange-800">
                    ราคารวม : {selectedItem.price * quantity}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors text-sm"
                  >
                    สั่งซื้อ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MenuForm;