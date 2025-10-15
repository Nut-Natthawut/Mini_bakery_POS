"use client";
/* eslint-disable */

import { useEffect, useState } from "react";
import EditMenuForm from "./editmenuForm";
import { getMenus, createMenu, deleteMenu } from "@/actions/menu";
import { getCategories } from "@/actions/categories";
import { MenuData, CategoryData } from "@/types/type";
import { toast } from "sonner";

const MenuList = () => {
  const [menuItems, setMenuItems] = useState<MenuData[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newCategories, setNewCategories] = useState<string[]>([]);

  const [categoriesMaster, setCategoriesMaster] = useState<CategoryData[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<MenuData | null>(null);

  useEffect(() => {
    (async () => {
      const [m, c] = await Promise.all([getMenus(), getCategories()]);
      if (m.success) {
        setMenuItems(m.data || []);
        toast.success("โหลดข้อมูลเมนูสำเร็จ");
      } else {
        toast.error(m.error || "โหลดข้อมูลเมนูไม่สำเร็จ");
      }
      if (c.success) setCategoriesMaster(c.data || []);
    })();
  }, []);

  const handleSave = (updated: MenuData) => {
    setMenuItems((prev) => prev.map((item) => (item.menuID === updated.menuID ? updated : item)));
    toast.success("บันทึกข้อมูลเมนูสำเร็จ");
  };

  const handleAddMenu = async () => {
    const name = newName.trim();
    const priceNum = parseFloat(newPrice);

    if (!name) return toast.error("กรุณากรอกชื่อเมนู");
    if (!Number.isFinite(priceNum) || priceNum <= 0) return toast.error("ราคาต้องมากกว่า 0");
    if (!newImageFile) return toast.error("กรุณาเลือกรูปเมนู");
    if (newCategories.length === 0) return toast.error("กรุณาเลือกหมวดหมู่");

    const fd = new FormData();
    fd.append("menuName", name);
    fd.append("price", String(priceNum));
    if (newDetail) fd.append("menuDetail", newDetail);
    fd.append("imageFile", newImageFile);
    newCategories.forEach((id) => fd.append("categories[]", id));

    const result = await createMenu(fd);

    if (result.success) {
      setMenuItems((prev) => [...prev, result.data!]);
      setNewName("");
      setNewPrice("");
      setNewDetail("");
      setNewImageFile(null);
      setNewCategories([]);
      setIsAddOpen(false);
      toast.success("เพิ่มเมนูสำเร็จ");
    } else {
      toast.error(result.error || "เพิ่มเมนูไม่สำเร็จ");
    }
  };

  const handleDeleteMenu = async (menuID: string) => {
    const result = await deleteMenu(menuID);
    if (result.success) {
      setMenuItems((prev) => prev.filter((item) => item.menuID !== menuID));
      setDeleteTarget(null);
      toast.success("ลบเมนูสำเร็จ");
    } else {
      toast.error(result.error || "ลบเมนูไม่สำเร็จ");
    }
  };

  return (
    <div className="w-[1168px] h-[442px] mx-auto">
      <div className="w-full mx-auto py-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 gap-4 p-4 bg-[#BF9270] text-white font-bold">
            <div>
              <button onClick={() => setIsAddOpen(true)} className="px-3 py-1 bg-[#D9ECD0] text-black font-poppins rounded-md hover:bg-green-600">
                เพิ่ม
              </button>
            </div>
            <div>ภาพ</div>
            <div>เมนู</div>
            <div>ราคา</div>
            <div>หมวดหมู่</div>
          </div>

          {menuItems.map((menu, index) => (
            <div key={menu.menuID} className="grid grid-cols-6 gap-4 p-4 items-center border-t border-gray-200">
              <div>{index + 1}</div>
              <div>
                <img src={menu.imageUrl || "https://via.placeholder.com/64"} alt={menu.menuName} className="w-16 h-16 object-cover rounded-md" />
              </div>
              <div>{menu.menuName}</div>
              <div>฿{Number(menu.price).toFixed(2)}</div>
              <div className="truncate">{(menu.categories || []).length > 0 ? (menu.categories || []).length + " หมวด" : "-"}</div>
              <div className="flex space-x-2">
                <EditMenuForm initialData={menu} onUpdate={handleSave} />
                <button onClick={() => setDeleteTarget(menu)} className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600">
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-center mb-4">เพิ่มเมนู</h2>
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddMenu();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อเมนู</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ราคา</label>
                <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">รายละเอียด (ไม่บังคับ)</label>
                <textarea value={newDetail} onChange={(e) => setNewDetail(e.target.value)} rows={3} className="block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {categoriesMaster.map((c) => {
                    const checked = newCategories.includes(c.categoryID);
                    return (
                      <label key={c.categoryID} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setNewCategories((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(c.categoryID);
                              else next.delete(c.categoryID);
                              return Array.from(next);
                            });
                          }}
                        />
                        <span>{c.categoryName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ภาพเมนู</label>
                <input type="file" accept="image/*" onChange={(e) => setNewImageFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-700" />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewName("");
                    setNewPrice("");
                    setNewDetail("");
                    setNewImageFile(null);
                    setNewCategories([]);
                  }}
                  className="px-4 py-2 text-sm bg-[#F7AEB9] rounded-md hover:bg-pink-300"
                >
                  ล้าง
                </button>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300">
                    ปิด
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    ตกลง
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-4/5 max-w-2xl p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">ยืนยันการลบ</h2>
            <p className="text-center text-red-600 mb-6">
              ต้องการลบเมนู <span className="font-semibold">{deleteTarget.menuName}</span> หรือไม่?
            </p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300">
                ยกเลิก
              </button>
              <button onClick={() => handleDeleteMenu(deleteTarget.menuID)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuList;
