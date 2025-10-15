"use client";
/* eslint-disable */

import { useEffect, useState } from "react";
import { MenuData, CategoryData } from "@/types/type";
import { updateMenu } from "@/actions/menu";
import { getCategories } from "@/actions/categories";
import { toast } from "sonner";

interface EditMenuFormProps {
  initialData: MenuData;
  onUpdate: (updatedData: MenuData) => void;
}

const EditMenuForm = ({ initialData, onUpdate }: EditMenuFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // โหลดรายการหมวดทั้งหมด
  const [categoriesMaster, setCategoriesMaster] = useState<CategoryData[]>([]);

  // ฟอร์ม
  const [form, setForm] = useState({
    menuName: initialData.menuName,
    price: String(initialData.price),
    menuDetail: initialData.menuDetail || "",
    imageFile: null as File | null,
    categories: initialData.categories || [], // รองรับหลายหมวด
  });

  // พรีวิวภาพใหม่ (ถ้าเลือกไฟล์)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // โหลดหมวดหมู่ทั้งหมด
    (async () => {
      const res = await getCategories();
      if (res.success && res.data) {
        setCategoriesMaster(res.data);
      } else {
        toast.error(res.error || "ไม่สามารถโหลดหมวดหมู่ได้");
      }
    })();
  }, []);

  // จัดการ input ทั่วไป + รูป
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as any;
    if (type === "file") {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setForm((prev) => ({ ...prev, imageFile: file }));
      if (file) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ติ๊กเลือก/ยกเลิกหมวดหมู่
  const toggleCategory = (categoryID: string, checked: boolean) => {
    setForm((prev) => {
      const next = new Set(prev.categories);
      if (checked) next.add(categoryID);
      else next.delete(categoryID);
      return { ...prev, categories: Array.from(next) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.menuName.trim()) return toast.error("กรุณากรอกชื่อเมนู");
    const priceNum = parseFloat(form.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      return toast.error("ราคาต้องมากกว่า 0");
    if (!form.categories || form.categories.length === 0)
      return toast.error("กรุณาเลือกหมวดหมู่");

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("menuID", String((initialData as any).menuID));
      fd.append("menuName", form.menuName.trim());
      fd.append("price", String(priceNum));
      if (form.menuDetail) fd.append("menuDetail", form.menuDetail);
      if (form.imageFile) fd.append("imageFile", form.imageFile);

      // ✅ แนบ categories แบบ JSON เดียว (ฝั่ง server อ่าน JSON.parse)
      fd.append("categories", JSON.stringify(form.categories));

      // ❗️ถ้า server ของคุณใช้ getAll('categories[]'):
      // (form.categories || []).forEach((id) => fd.append("categories[]", id));

      const result = await updateMenu(fd);
      if (!result.success) throw new Error(result.error);

      onUpdate(result.data!);
      toast.success("อัพเดทเมนูสำเร็จ");
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการอัพเดทเมนู");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 text-sm text-[#0B57AF] bg-[#D0DFEC] rounded-md hover:bg-blue-200"
      >
        แก้ไข
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">แก้ไขเมนู</h2>

            <button
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="close"
            >
              ✕
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ชื่อเมนู */}
              <div>
                <label className="block text-sm font-medium">ชื่อเมนู</label>
                <input
                  type="text"
                  name="menuName"
                  value={form.menuName}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={isLoading}
                />
              </div>

              {/* ราคา */}
              <div>
                <label className="block text-sm font-medium">ราคา</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={isLoading}
                />
              </div>

              {/* รายละเอียด */}
              <div>
                <label className="block text-sm font-medium">รายละเอียด</label>
                <textarea
                  name="menuDetail"
                  value={form.menuDetail}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={isLoading}
                />
              </div>

              {/* หมวดหมู่ (ไม่มีปุ่มเพิ่มหมวด) */}
              <div>
                <label className="block text-sm font-medium">หมวดหมู่</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {categoriesMaster.map((c) => {
                    const checked = (form.categories || []).includes(c.categoryID);
                    return (
                      <label key={c.categoryID} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleCategory(c.categoryID, e.target.checked)}
                          disabled={isLoading}
                        />
                        <span>{c.categoryName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* อัปโหลดรูป */}
              <div>
                <label className="block text-sm font-medium">รูปเมนู</label>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              {/* พรีวิว */}
              <div className="flex justify-center">
                <img
                  src={previewUrl || initialData.imageUrl || ""}
                  alt={initialData.menuName}
                  className="w-24 h-24 object-cover rounded-md border"
                />
              </div>

              {/* ปุ่ม */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-200 rounded-md"
                  disabled={isLoading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditMenuForm;
