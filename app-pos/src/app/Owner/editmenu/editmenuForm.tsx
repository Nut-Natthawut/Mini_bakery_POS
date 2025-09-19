// EditMenuForm.tsx - Improved version
/* eslint-disable */
"use client";

import { useState } from 'react';
import { MenuData, MenuFormData } from "@/types/type";
import { updateMenu } from "@/actions/menu";
import { toast } from "sonner";

interface EditMenuFormProps {
  initialData: MenuData;
  onUpdate: (updatedData: MenuData) => void;
}

const EditMenuForm = ({ initialData, onUpdate }: EditMenuFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<MenuFormData>({
    menuName: initialData.menuName,
    price: initialData.price,
    menuDetail: initialData.menuDetail || "",
    imageFile: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      if (files?.length) {
        setFormData(prev => ({
          ...prev,
          imageFile: files[0]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.menuName.trim()) {
      toast.error("กรุณากรอกชื่อเมนู");
      return false;
    }
    
    if (!formData.price || formData.price <= 0) {
      toast.error("ราคาต้องมากกว่า 0");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  setIsLoading(true);

  try {
    const fd = new FormData();
    fd.append("menuID", initialData.menuID!);
    fd.append("menuName", formData.menuName.trim());
    fd.append("price", String(formData.price));
    if (formData.menuDetail) fd.append("menuDetail", formData.menuDetail);
    if (formData.imageFile) fd.append("imageFile", formData.imageFile);

    const result = await updateMenu(fd); // ส่ง FormData

    if (!result.success) throw new Error(result.error);
    onUpdate(result.data!);
    toast.success("อัพเดทเมนูสำเร็จ");
    setIsOpen(false);
  } catch (error: any) {
    toast.error(error.message || "เกิดข้อผิดพลาดในการอัพเดทเมนู");
  } finally {
    setIsLoading(false);
  }
};

  const closeModal = () => {
    if (!isLoading) {
      setIsOpen(false);
      // Reset form data to initial values when closing
      setFormData({
        menuName: initialData.menuName,
        price: initialData.price,
        menuDetail: initialData.menuDetail || "",
        imageFile: null
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 font-poppins text-sm text-[#0B57AF] bg-[#D0DFEC] rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        แก้ไข
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">แก้ไขเมนู</h2>
            
            <button
              onClick={closeModal}
              disabled={isLoading}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
              aria-label="ปิด"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-menuName" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อเมนู <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-menuName"
                  name="menuName"
                  value={formData.menuName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
                  ราคา (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="edit-price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-menuDetail" className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  id="edit-menuDetail"
                  name="menuDetail"
                  value={formData.menuDetail}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพเมนู</label>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full text-sm text-gray-700 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">รองรับไฟล์: JPG, PNG, GIF (ไม่เกิน 5MB)</p>
              </div>

              {initialData.imageUrl && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={initialData.imageUrl}
                      alt={initialData.menuName}
                      className="w-32 h-32 object-cover rounded-md border"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-md transition-opacity" />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
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