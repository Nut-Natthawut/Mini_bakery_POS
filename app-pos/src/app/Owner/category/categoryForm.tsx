"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { getCategories, addCategory, updateCategory, deleteCategory, CategoryFormData } from "../../actions/categories";

interface Category {
  categoryID: string;
  categoryName: string;
}

const CategoryForm = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dialog, setDialog] = useState<{
    type: "add" | "edit" | "delete";
    open: boolean;
    data?: Category | null;
  }>({ type: "add", open: false, data: null });
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    loadCategories();
  }, []);

  const showToast = (success: boolean, message: string) => {
    if (success) {
      toast.success(message, { autoClose: 3000 });
    } else {
      toast.error(message, { autoClose: 5000 });
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result: CategoryFormData = await getCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        showToast(false, result.error || "ไม่สามารถโหลดข้อมูลได้");
      }
    } catch (err) {
      showToast(false, "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      console.error(err);
    }
    setLoading(false);
  };

  const handleDialogOpen = (type: "add" | "edit" | "delete", data?: Category) => {
    setDialog({ type, open: true, data });
    setInputValue(type === "edit" && data ? data.categoryName : "");
  };

  const handleDialogClose = () => {
    setDialog((prev) => ({ ...prev, open: false, data: null }));
    setInputValue("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let result: CategoryFormData;
      if (dialog.type === "add") {
        result = await addCategory(inputValue);
        if (result.success) {
          await loadCategories();
          handleDialogClose();
          showToast(true, "เพิ่มประเภทสำเร็จ");
        } else {
          showToast(false, result.error || "ไม่สามารถเพิ่มประเภทได้");
        }
      } else if (dialog.type === "edit" && dialog.data) {
        result = await updateCategory(dialog.data.categoryID, inputValue);
        if (result.success) {
          await loadCategories();
          handleDialogClose();
          showToast(true, "แก้ไขประเภทสำเร็จ");
        } else {
          showToast(false, result.error || "ไม่สามารถแก้ไขประเภทได้");
        }
      } else if (dialog.type === "delete" && dialog.data) {
        result = await deleteCategory(dialog.data.categoryID);
        if (result.success) {
          await loadCategories();
          handleDialogClose();
          showToast(true, "ลบประเภทสำเร็จ");
        } else {
          showToast(false, result.error || "ไม่สามารถลบประเภทได้");
        }
      }
    } catch (err) {
      showToast(false, `เกิดข้อผิดพลาดในการ${dialog.type === "add" ? "เพิ่ม" : dialog.type === "edit" ? "แก้ไข" : "ลบ"}ประเภท`);
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center m-[90px]">
      <div className="border w-[1051px] rounded-lg shadow-md overflow-hidden">
        <Table className="w-full">
          <TableHeader className="h-[77px] w-[1051px]">
            <TableRow className="bg-[#BF9270] hover:bg-[#BF9270]">
              <TableHead className="w-[150px] text-white">
                <div className="flex justify-center items-center h-full">
                  <Button
                    onClick={() => handleDialogOpen("add")}
                    className="bg-[#D9ECD0] hover:bg-[#D9ECD0] text-black w-[90px] h-[50px] text-[20px]"
                    disabled={loading}
                  >
                    เพิ่ม
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-white text-[20px] px-[150px]">
                ประเภท
              </TableHead>
              <TableHead className="text-center text-white w-[200px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {categories.map((cat, index) => (
              <TableRow key={cat.categoryID}>
                <TableCell className="text-center h-[66px] text-[20px]">
                  {index + 1}
                </TableCell>
                <TableCell className="text-[20px] px-[150px]">
                  {cat.categoryName}
                </TableCell>
                <TableCell className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    className="bg-[#81b6e4] hover:bg-blue-500 text-[#0B57AF] w-[90px] h-[50px] text-[20px]"
                    onClick={() => handleDialogOpen("edit", cat)}
                    disabled={loading}
                  >
                    แก้ไข
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#F7AEB9] hover:bg-red-500 text-[#A41F1F] w-[90px] h-[50px] text-[20px]"
                    onClick={() => handleDialogOpen("delete", cat)}
                    disabled={loading}
                  >
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog.open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[700px] bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle
              className={`text-[24px] mx-auto ${
                dialog.type === "delete" ? "text-red-600" : dialog.type === "edit" ? "text-blue-600" : ""
              }`}
            >
              {dialog.type === "add" && "เพิ่ม"}
              {dialog.type === "edit" && "แก้ไขหมวดหมู่"}
              {dialog.type === "delete" && "ต้องการลบหรือไม่"}
            </DialogTitle>
          </DialogHeader>

          {dialog.type !== "delete" ? (
            <div className="grid gap-4 py-4">
              <label className="text-[18px]">ชื่อหมวดหมู่</label>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="กรอกชื่อหมวดหมู่"
                className="text-[18px]"
                disabled={loading}
              />
            </div>
          ) : (
            <div className="text-center text-[18px] py-4">
              คุณแน่ใจหรือว่าต้องการลบหมวดหมู่นี้?
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2">
            {dialog.type !== "delete" && (
              <Button
                variant="outline"
                onClick={() => setInputValue("")}
                className="w-[90px] h-[40px] bg-[#F7AEB9] hover:bg-[#f08998] text-black"
                disabled={loading}
              >
                ล้าง
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDialogClose}
              className="w-[90px] h-[40px] bg-[#D9ECD0] hover:bg-[#c0d9b8] text-black"
              disabled={loading}
            >
              {dialog.type === "delete" ? "ยกเลิก" : "ปิด"}
            </Button>
            <Button
              onClick={handleSubmit}
              className={`w-[90px] h-[40px] ${
                dialog.type === "delete"
                  ? "bg-[#D62D2D] hover:bg-[#f08998] text-white"
                  : "bg-[#1D93F9] hover:bg-sky-600 text-white"
              }`}
              disabled={loading}
            >
              {dialog.type === "delete" ? "ลบ" : dialog.type === "edit" ? "บันทึก" : "ตกลง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryForm;