"use server";
/* eslint-disable */
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import type { ApiResponse, MenuData } from "@/types/type";
import { uploadImage, deleteImage } from "@/utils/images"; // upload/delete ที่คุยกันไว้

const mapMenu = (m: any): MenuData => ({
  menuID: m.menuID,
  menuName: m.menuName,
  price: parseFloat(String(m.price)),
  menuDetail: m.menuDetail ?? undefined,
  imageUrl: m.imageUrl ?? undefined,
  categories: [],
  createdAt: m.createdAt.toISOString(),
  updatedAt: m.updatedAt.toISOString(),
});

export async function getMenus(): Promise<ApiResponse<MenuData[]>> {
  try {
    const menus = await prisma.menu.findMany({ orderBy: { createdAt: "desc" } });
    return { success: true, data: menus.map(mapMenu) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** รับ FormData จาก client */
export async function createMenu(fd: FormData): Promise<ApiResponse<MenuData>> {
  try {
    const menuName = String(fd.get("menuName") || "").trim();
    const price = Number(fd.get("price") || 0);
    const menuDetail = (fd.get("menuDetail") as string) || null;
    const imageFile = fd.get("imageFile") as File | null;

    if (!menuName) return { success: false, error: "กรุณากรอกชื่อเมนู" };
    if (!Number.isFinite(price) || price <= 0) {
      return { success: false, error: "ราคาต้องมากกว่า 0" };
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile); //  อัปโหลดไป Supabase แล้วคืน public URL
    }

    const created = await prisma.menu.create({
      data: {
        menuName,
        price: new Decimal(price),
        menuDetail,
        imageUrl,
      },
    });

    revalidatePath("/owner/menu");
    return { success: true, data: mapMenu(created) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**  รับ FormData จาก client */
export async function updateMenu(fd: FormData): Promise<ApiResponse<MenuData>> {
  try {
    const menuID = String(fd.get("menuID") || "");
    const menuName = String(fd.get("menuName") || "").trim();
    const price = Number(fd.get("price") || 0);
    const menuDetail = (fd.get("menuDetail") as string) || null;
    const imageFile = fd.get("imageFile") as File | null;

    if (!menuID) return { success: false, error: "ไม่พบเมนูที่จะอัปเดต" };
    if (!menuName) return { success: false, error: "กรุณากรอกชื่อเมนู" };
    if (!Number.isFinite(price) || price <= 0) {
      return { success: false, error: "ราคาต้องมากกว่า 0" };
    }

    const current = await prisma.menu.findUnique({ where: { menuID } });
    if (!current) return { success: false, error: "เมนูไม่พบ" };

    let imageUrl = current.imageUrl as string | null;

    if (imageFile && imageFile.size > 0) {
      if (imageUrl) await deleteImage(imageUrl); 
      imageUrl = await uploadImage(imageFile);
    }

    const updated = await prisma.menu.update({
      where: { menuID },
      data: {
        menuName,
        price: new Decimal(price),
        menuDetail,
        imageUrl,
      },
    });

    revalidatePath("/owner/menu");
    return { success: true, data: mapMenu(updated) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteMenu(menuID: string): Promise<ApiResponse<null>> {
  try {
    const m = await prisma.menu.findUnique({ where: { menuID } });
    if (!m) return { success: false, error: "เมนูไม่พบ" };

    if (m.imageUrl) await deleteImage(m.imageUrl);
    await prisma.menu.delete({ where: { menuID } });

    revalidatePath("/owner/menu");
    return { success: true, data: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
