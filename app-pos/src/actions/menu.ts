/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ApiResponse, MenuData } from "@/types/type";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const prisma = new PrismaClient();

// ปรับ path ให้ตรงกับหน้า UI ของคุณ
const REVALIDATE_MENU_PATH = "/Owner/menu";

/* -------------------- Utils -------------------- */

// แปลง Prisma result -> MenuData (อ่าน relation จาก m.categories)
function serializeMenu(m: any): MenuData {
  const cats = Array.isArray(m?.categories)
    ? m.categories.map((mc: any) => mc.categoryID)
    : [];

  return {
    menuID: m.menuID,
    menuName: m.menuName,
    price: Number(m.price),
    menuDetail: m.menuDetail ?? undefined,
    imageUrl: m.imageUrl ?? undefined,
    categories: cats,
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : undefined,
    updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : undefined,
  };
}

// อ่าน categories จาก FormData: รองรับทั้ง JSON ("categories") และหลายคีย์ ("categories[]")
function readCategoriesFromFD(fd: FormData): string[] {
  const jsonStr = fd.get("categories") as string | null;
  if (jsonStr) {
    try {
      const arr = JSON.parse(jsonStr);
      if (Array.isArray(arr)) return arr.map(String).filter(Boolean);
    } catch (e) {
      console.error("Parse categories JSON error:", e);
    }
  }
  return fd.getAll("categories[]").map(String).filter(Boolean);
}

// (ทางเลือก) อัปโหลดรูปและคืน URL — ใส่ระบบจริงของคุณที่นี่
async function uploadImageAndGetUrl(file: File | null, current?: string | null) {
  if (!file) {
    // ถ้าไม่มีการอัปโหลดใหม่ ก็ใช้ URL เดิม
    return current ?? undefined;
  }

  // สร้างชื่อไฟล์ปลอดภัยด้วย UUID + นามสกุลที่เป็นตัวอักษร/ตัวเลขเท่านั้น
  const rawExt = (file.name?.split('.')?.pop() || '').toLowerCase();
  const safeExt = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : 'png';
  const fileName = `${crypto.randomUUID()}.${safeExt}`;

  // แปลงเป็น Buffer เพื่ออัปโหลดจากฝั่ง server action
  const buffer = Buffer.from(await file.arrayBuffer());

  //  Upload to Supabase Storage
  const supa = createSupabaseServerClient();
  const { error } = await supa.storage
    .from("menu") // bucket
    .upload(`menus/${fileName}`, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || `image/${safeExt}`,
    });

  if (error) {
    console.error("Upload failed:", error.message);
    throw new Error("อัปโหลดรูปภาพไม่สำเร็จ");
  }

  //  ได้ public URL กลับมา
  const { data: urlData } = await supa.storage
    .from("menu")
    .getPublicUrl(`menus/${fileName}`);

  return urlData.publicUrl;
}

/* -------------------- Actions -------------------- */

// GET: เมนูทั้งหมด
export async function getMenus(): Promise<ApiResponse<MenuData[]>> {
  try {
    const rows = await prisma.menu.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        // ✅ ตาม schema: relation ชื่อ "categories"
        categories: { select: { categoryID: true } },
      },
    });
    const data = rows.map(serializeMenu);
    return { success: true, data };
  } catch (error) {
    console.error("getMenus error:", error);
    return { success: false, error: "ไม่สามารถดึงเมนูได้" };
  }
}

// GET: เมนูตาม ID
export async function getMenuById(menuID: string): Promise<ApiResponse<MenuData>> {
  try {
    const m = await prisma.menu.findUnique({
      where: { menuID },
      include: { categories: { select: { categoryID: true } } },
    });
    if (!m) return { success: false, error: "ไม่พบเมนูที่ระบุ" };
    return { success: true, data: serializeMenu(m) };
  } catch (e) {
    console.error("getMenuById error:", e);
    return { success: false, error: "ไม่สามารถดึงข้อมูลเมนูได้" };
  }
}

// POST: สร้างเมนู
export async function createMenu(formData: FormData): Promise<ApiResponse<MenuData>> {
  try {
    const menuName = String(formData.get("menuName") || "").trim();
    const price = Number(formData.get("price"));
    const menuDetail = (formData.get("menuDetail") as string) || undefined;
    const imageFile = (formData.get("imageFile") as File) || null;

    if (!menuName) return { success: false, error: "กรุณากรอกชื่อเมนู" };
    if (!Number.isFinite(price) || price <= 0) return { success: false, error: "ราคาต้องมากกว่า 0" };

    const categories = readCategoriesFromFD(formData);
    if (categories.length === 0) return { success: false, error: "กรุณาเลือกหมวดหมู่" };

    const imageUrl = await uploadImageAndGetUrl(imageFile, null);

    const created = await prisma.menu.create({
      data: { menuName, price, menuDetail, imageUrl: imageUrl ?? null },
    });

    // เชื่อมความสัมพันธ์ใน join table (model: Menu_Category)
    await prisma.$transaction(
      categories.map((categoryID) =>
        prisma.menu_Category.create({ data: { menuID: created.menuID, categoryID } })
      )
    );

    const withCats = await prisma.menu.findUnique({
      where: { menuID: created.menuID },
      include: { categories: { select: { categoryID: true } } },
    });

    revalidatePath(REVALIDATE_MENU_PATH);

    return { success: true, data: serializeMenu(withCats || created) };
  } catch (error) {
    console.error("createMenu error:", error);
    return { success: false, error: "ไม่สามารถเพิ่มเมนูได้" };
  }
}

// PATCH: อัปเดตเมนู
export async function updateMenu(formData: FormData): Promise<ApiResponse<MenuData>> {
  try {
    const menuID = String(formData.get("menuID") || "");
    const menuName = (formData.get("menuName") as string) || "";
    const price = Number(formData.get("price"));
    const menuDetail = (formData.get("menuDetail") as string) || undefined;
    const imageFile = (formData.get("imageFile") as File) || null;

    if (!menuID) return { success: false, error: "ไม่พบเมนูที่ต้องการแก้ไข" };
    if (!menuName.trim()) return { success: false, error: "กรุณากรอกชื่อเมนู" };
    if (!Number.isFinite(price) || price <= 0) return { success: false, error: "ราคาต้องมากกว่า 0" };

    const categories = readCategoriesFromFD(formData);
    if (categories.length === 0) return { success: false, error: "กรุณาเลือกหมวดหมู่" };

    const current = await prisma.menu.findUnique({
      where: { menuID },
      select: { imageUrl: true },
    });
    if (!current) return { success: false, error: "ไม่พบเมนูที่ต้องการแก้ไข" };

    const imageUrl = await uploadImageAndGetUrl(imageFile, current.imageUrl);

    const updated = await prisma.menu.update({
      where: { menuID },
      data: {
        menuName: menuName.trim(),
        price,
        menuDetail,
        imageUrl: imageUrl ?? current.imageUrl ?? null,
      },
    });

    // sync relation: ลบของเดิม แล้วสร้างใหม่ตาม categories ล่าสุด
    await prisma.$transaction([
      prisma.menu_Category.deleteMany({ where: { menuID } }),
      ...categories.map((categoryID) =>
        prisma.menu_Category.create({ data: { menuID, categoryID } })
      ),
    ]);

    const withCats = await prisma.menu.findUnique({
      where: { menuID: updated.menuID },
      include: { categories: { select: { categoryID: true } } },
    });

    revalidatePath(REVALIDATE_MENU_PATH);

    return { success: true, data: serializeMenu(withCats || updated) };
  } catch (error) {
    console.error("updateMenu error:", error);
    return { success: false, error: "ไม่สามารถอัปเดตเมนูได้" };
  }
}

// DELETE: ลบเมนู
export async function deleteMenu(menuID: string): Promise<ApiResponse<{ message: string }>> {
  try {
    if (!menuID) return { success: false, error: "ไม่พบเมนูที่ต้องการลบ" };

    await prisma.menu_Category.deleteMany({ where: { menuID } });
    await prisma.menu.delete({ where: { menuID } });

    revalidatePath(REVALIDATE_MENU_PATH);

    return { success: true, data: { message: "ลบเมนูเรียบร้อยแล้ว" } };
  } catch (error) {
    console.error("deleteMenu error:", error);
    return { success: false, error: "ไม่สามารถลบเมนูได้" };
  }
}

