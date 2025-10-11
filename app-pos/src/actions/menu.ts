/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadImage, deleteImage } from "@/utils/images";
import {
  formDataToCreate,
  formDataToUpdate,
  createMenuSchema,
  updateMenuSchema,
  validateImageFile,
  formatZodError,
} from "@/validation/menu";
import { MenuData } from "@/types/type";

/* ---------- Helpers ---------- */
function mapMenu(m: any): MenuData {
  return {
    menuID: m.menuID,
    menuName: m.menuName,
    price: Number(m.price), // ให้ UI เอาไป toFixed ได้
    menuDetail: m.menuDetail ?? undefined,
    imageUrl: m.imageUrl ?? undefined,
    createdAt: m.createdAt?.toISOString?.() ?? undefined,
    updatedAt: m.updatedAt?.toISOString?.() ?? undefined,
  };
}

/* ---------- GET ---------- */
export async function getMenus() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: menus.map(mapMenu) as MenuData[] };
  } catch {
    return { success: false, error: "โหลดข้อมูลเมนูไม่สำเร็จ" };
  }
}

/* ---------- CREATE ---------- */
export async function createMenu(fd: FormData) {
  try {
    // 1) FormData → object
    const parsed = formDataToCreate(fd);
    // 2) zod validate
    const validated = createMenuSchema.parse(parsed);

    // 3)  (required = true)
    const imgCheck = validateImageFile(parsed.imageFile, true);
    if (!imgCheck.isValid) throw new Error(imgCheck.error);

    // 4) upload (ถ้ามาถึงนี่แปลว่ามีไฟล์แล้ว)
    const imageUrl = await uploadImage(parsed.imageFile!);

    // 5) save DB
    const created = await prisma.menu.create({
      data: {
        menuName: validated.menuName,
        price: validated.price, // Prisma Decimal  number or string
        menuDetail: validated.menuDetail || null,
        imageUrl,
      },
    });

    revalidatePath("/Owner/editmenu");
    return { success: true, data: mapMenu(created) };
  } catch (e) {
    return { success: false, error: formatZodError(e) };
  }
}

/* ---------- UPDATE ---------- */
export async function updateMenu(fd: FormData) {
  try {
    // 1) FormData → object
    const parsed = formDataToUpdate(fd);
    // 2) zod validate
    const validated = updateMenuSchema.parse(parsed);

    // 3) find existing menu
    const old = await prisma.menu.findUnique({
      where: { menuID: validated.menuID },
    });
    if (!old) throw new Error("ไม่พบเมนูที่จะอัปเดต");

    // 4) image (required = false)
    let nextImageUrl = old.imageUrl ?? null;
    const imgCheck = validateImageFile(parsed.imageFile, false);
    if (!imgCheck.isValid) throw new Error(imgCheck.error);

    // if imageFile is provided → upload new & delete old
    if (parsed.imageFile) {
      if (nextImageUrl) await deleteImage(nextImageUrl);
      nextImageUrl = await uploadImage(parsed.imageFile);
    }

    // 5) update DB
    const updated = await prisma.menu.update({
      where: { menuID: validated.menuID },
      data: {
        menuName: validated.menuName,
        price: validated.price,
        menuDetail: validated.menuDetail || null,
        imageUrl: nextImageUrl,
      },
    });

    revalidatePath("/Owner/editmenu");
    return { success: true, data: mapMenu(updated) };
  } catch (e) {
    return { success: false, error: formatZodError(e) };
  }
}

/* ---------- DELETE ---------- */
export async function deleteMenu(menuID: string) {
  try {
    const old = await prisma.menu.findUnique({ where: { menuID } });
    if (!old) throw new Error("ไม่พบเมนูที่จะลบ");

    if (old.imageUrl) await deleteImage(old.imageUrl);
    await prisma.menu.delete({ where: { menuID } });

    revalidatePath("/Owner/editmenu");
    return { success: true };
  } catch (e) {
    return { success: false, error: formatZodError(e) };
  }
}
