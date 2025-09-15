// src/app/Owner/editmenu/MenuList.tsx
'use client';
import { useState } from 'react';
import EditMenuForm from './editmenuForm';

// กำหนด Interface สำหรับข้อมูลเมนู
interface MenuData {
  id: number;
  menuName: string;
  price: number;
  image: string;
}

const MenuList = () => {
  // ใช้ useState เพื่อจัดการข้อมูลเมนู (จำลอง)
  const [menuItems, setMenuItems] = useState<MenuData[]>([
    { id: 1, menuName: 'เค้กช็อกโกแลต', price: 199, image: 'https://via.placeholder.com/64' },
    { id: 2, menuName: 'เค้กชาเขียว', price: 180, image: 'https://via.placeholder.com/64' },
    { id: 3, menuName: 'เค้กส้ม', price: 175, image: 'https://via.placeholder.com/64' },
  ]);

  const handleSave = (updatedData: MenuData) => {
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === updatedData.id ? updatedData : item
      )
    );
    console.log('อัปเดตข้อมูลเมนู:', updatedData);
    alert(`บันทึกข้อมูลเมนู ${updatedData.menuName} เรียบร้อยแล้ว`);
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* ส่วนหัวของตาราง */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-[#BF9270] text-white font-poppins">
          <div className="col-span-1 font-poppins">ID</div>
          <div className="col-span-1font-poppins">ภาพ</div>
          <div className="col-span-1 font-poppins">เมนู</div>
          <div className="col-span-1 font-poppins">ราคา</div>
          <div className="col-span-1">จัดการ</div>
        </div>

        {/* รายการเมนู */}
        {menuItems.map((menu) => (
          <div key={menu.id} className="grid grid-cols-5 gap-4 p-4 items-center border-t border-gray-200">
            <div className="col-span-1">{menu.id}</div>
            <div className="col-span-1">
              <img src={menu.image} alt={menu.menuName} className="w-16 h-16 object-cover rounded-md" />
            </div>
            <div className="col-span-1">{menu.menuName}</div>
            <div className="col-span-1">{menu.price}</div>
            <div className="col-span-1 flex space-x-2">
              <EditMenuForm initialData={menu} onSave={handleSave} />
              <button className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600">
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuList;