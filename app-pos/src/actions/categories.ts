"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
const prisma = new PrismaClient();

export type CategoryFormData = {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
};

//get
export async function getCategories(): Promise<CategoryFormData> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });
    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      error: "ไม่สามารถดึงข้อมูลประเภทได้",
    };
  }
}

export async function addCategory(
  categoryName: string
): Promise<CategoryFormData> {
  try {
    if (!categoryName || categoryName.trim() === "") {
      return {
        success: false,
        error: "กรุณากรอกชื่อประเภทสินค้า",
      };
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        categoryName: categoryName.trim(),
      },
    });

    if (existingCategory) {
      return {
        success: false,
        error: "มีประเภทสินค้านี้อยู่แล้ว",
      };
    }

    const newCategory = await prisma.category.create({
      data: {
        categoryName: categoryName.trim(),
      },
    });

    revalidatePath("/categorises");

    return {
      success: true,
      data: newCategory,
    };
  } catch (error) {
    console.error("Error adding category:", error);
    return {
      success: false,
      error: "ไม่สามารถเพิ่มประเภทสินค้าได้",
    };
  }
}

export async function updateCategory(
  categoryID: string,
  categoryName: string
): Promise<CategoryFormData> {
  try {
    if (!categoryName || categoryName.trim() === "") {
      return {
        success: false,
        error: "กรุณากรอกชื่อประเภทสินค้า",
      };
    }

    if (!categoryID) {
      return {
        success: false,
        error: "ไม่พบประเภทสินค้าที่ต้องการแก้ไข",
      };
    }
    const existingCategory = await prisma.category.findUnique({
      where: {
        categoryID: categoryID,
      },
    });
    if (!existingCategory) {
      return {
        success: false,
        error: "ไม่พบประเภทสินค้าที่ต้องการแก้ไข",
      };
    }
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        categoryName: categoryName.trim(),
        NOT: {
          categoryID: categoryID,
        },
      },
    });

    if (duplicateCategory) {
      return {
        success: false,
        error: "มีประเภทสินค้านี้อยู่แล้ว",
      };
    }
    const updatedCategory = await prisma.category.update({
      where: {
        categoryID: categoryID,
      },
      data: {
        categoryName: categoryName.trim(),
      },
    });

    revalidatePath("/categorises");

    return {
      success: true,
      data: updatedCategory,
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return {
      success: false,
      error: "ไม่สามารถแก้ไขประเภทสินค้าได้",
    };
  }
}

export async function deleteCategory(
  categoryID: string
): Promise<CategoryFormData> {
  try {
    if (!categoryID) {
      return {
        success: false,
        error: "ไม่พบประเภทสินค้าที่ต้องการลบ",
      };
    }
    const existingCategory = await prisma.category.findUnique({
      where: {
        categoryID: categoryID,
      },
    });
    if (!existingCategory) {
      return {
        success: false,
        error: "ไม่พบประเภทสินค้าที่ต้องการลบ",
      };
    }

    const menuCategoryCount = await prisma.menu_Category.count({
      where: {
        categoryID: categoryID,
      },
    });

    if (menuCategoryCount > 0) {
      return {
        success: false,
        error: "ไม่สามารถลบประเภทสินค้านี้ได้ เนื่องจากมีสินค้าในประเภทนี้อยู่",
      };
    }

    await prisma.category.delete({
      where: {
        categoryID: categoryID,
      },
    });

    revalidatePath("/categorises");

    return {
      success: true,
      data: { message: "ลบประเภทสินค้าเรียบร้อยแล้ว" },
    };
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      error: "ไม่สามารถลบประเภทสินค้าได้",
    };
  }
}

export async function getCategoryById(
  categoryID: string
): Promise<CategoryFormData> {
  try {
    if (!categoryID) {
      return {
        success: false,
        error: "ไม่พบประเภทสินค้าที่ต้องการแก้ไข",
      };
    }
    const category = await prisma.category.findUnique({
      where: {
        categoryID: categoryID,
      },
    });
    if (!category) {
      return {
        success: false,
        error: "ไม่พบประเภทที่ระบุ",
      };
    }
    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Error getting category by ID:", error);
    return {
      success: false,
      error: "ไม่สามารถดึงประเภทสินค้าได้",
    };
  }
}

/* ---------------------------------------------------------------------------
   🔽 เพิ่มฟังก์ชันใหม่ด้านล่างนี้ — ไม่แก้/ไม่ลบของเดิมออก 🔽
--------------------------------------------------------------------------- */

// ✅ เวอร์ชัน add แบบ case-insensitive + trim แน่นหนา
export async function addCategorySafe(name: string): Promise<CategoryFormData> {
  try {
    const categoryName = (name || "").trim();
    if (!categoryName) return { success: false, error: "กรุณากรอกชื่อประเภทสินค้า" };

    const dup = await prisma.category.findFirst({
      where: { categoryName: { equals: categoryName, mode: "insensitive" } },
      select: { categoryID: true },
    });
    if (dup) return { success: false, error: "มีประเภทสินค้านี้อยู่แล้ว" };

    const created = await prisma.category.create({
      data: { categoryName },
    });

    revalidatePath("/categorises");
    return { success: true, data: created };
  } catch (e) {
    console.error("addCategorySafe error:", e);
    return { success: false, error: "ไม่สามารถเพิ่มประเภทสินค้าได้" };
  }
}

// ✅ เพิ่มผ่าน FormData (เผื่อเรียกจาก client ที่ส่ง fd มา)
export async function addCategoryFromForm(fd: FormData): Promise<CategoryFormData> {
  const name = String(fd.get("categoryName") || "");
  return addCategorySafe(name);
}

// ✅ แก้ไขชื่อ (case-insensitive guard)
export async function updateCategorySafe(
  categoryID: string,
  name: string
): Promise<CategoryFormData> {
  try {
    const categoryName = (name || "").trim();
    if (!categoryID) return { success: false, error: "ไม่พบประเภทสินค้าที่ต้องการแก้ไข" };
    if (!categoryName) return { success: false, error: "กรุณากรอกชื่อประเภทสินค้า" };

    const exists = await prisma.category.findUnique({ where: { categoryID } });
    if (!exists) return { success: false, error: "ไม่พบประเภทสินค้าที่ต้องการแก้ไข" };

    const dup = await prisma.category.findFirst({
      where: {
        categoryName: { equals: categoryName, mode: "insensitive" },
        NOT: { categoryID },
      },
      select: { categoryID: true },
    });
    if (dup) return { success: false, error: "มีประเภทสินค้านี้อยู่แล้ว" };

    const updated = await prisma.category.update({
      where: { categoryID },
      data: { categoryName },
    });

    revalidatePath("/categorises");
    return { success: true, data: updated };
  } catch (e) {
    console.error("updateCategorySafe error:", e);
    return { success: false, error: "ไม่สามารถแก้ไขประเภทสินค้าได้" };
  }
}

// ✅ ค้นหาหมวดหมู่ (ใช้กับฟิลด์ค้นหา/auto-complete)
export async function searchCategories(keyword: string): Promise<CategoryFormData> {
  try {
    const q = (keyword || "").trim();
    const rows = await prisma.category.findMany({
      where: q
        ? { categoryName: { contains: q, mode: "insensitive" } }
        : undefined,
      orderBy: { categoryName: "asc" },
      select: { categoryID: true, categoryName: true },
    });
    return { success: true, data: rows };
  } catch (e) {
    console.error("searchCategories error:", e);
    return { success: false, error: "ค้นหาประเภทสินค้าไม่สำเร็จ" };
  }
}

// ✅ เพิ่มหลายหมวดในครั้งเดียว (ข้ามตัวที่ซ้ำ)
export async function bulkAddCategories(
  names: string[]
): Promise<CategoryFormData> {
  try {
    const trimmed = (names || []).map((n) => (n || "").trim()).filter(Boolean);
    if (trimmed.length === 0) return { success: false, error: "ไม่มีชื่อประเภทให้เพิ่ม" };

    const existing = await prisma.category.findMany({
      where: { categoryName: { in: trimmed } },
      select: { categoryName: true },
    });
    const existSet = new Set(existing.map((x) => x.categoryName.toLowerCase()));

    const toCreate = trimmed.filter((n) => !existSet.has(n.toLowerCase()));
    if (toCreate.length === 0) {
      return { success: true, data: { created: [], skipped: trimmed } };
    }

    const created = await prisma.$transaction(
      toCreate.map((name) =>
        prisma.category.create({
          data: { categoryName: name },
          select: { categoryID: true, categoryName: true },
        })
      )
    );

    revalidatePath("/categorises");
    return { success: true, data: { created, skipped: Array.from(existSet) } };

  } catch (e) {
    console.error("bulkAddCategories error:", e);
    return { success: false, error: "เพิ่มหมวดหมู่แบบหลายรายการไม่สำเร็จ" };
  }
}

/* ===== ฟังก์ชันจัดการตารางเชื่อมเมนู-หมวดหมู่ (menu_Category) =====
   ใช้ร่วมกับฟีเจอร์ที่เมนู 1 รายการ อยู่ได้หลายหมวด (categories: string[])
*/

// แนบหมวดให้เมนู (เพิ่มเฉพาะรายการที่ยังไม่มี)
export async function attachMenuCategories(
  menuID: string,
  categoryIDs: string[]
): Promise<CategoryFormData> {
  try {
    if (!menuID) return { success: false, error: "ไม่พบเมนู" };
    const ids = Array.from(new Set((categoryIDs || []).filter(Boolean)));
    if (ids.length === 0) return { success: true, data: [] };

    // หาอันที่มีอยู่แล้ว เพื่อตัดทิ้ง
    const existing = await prisma.menu_Category.findMany({
      where: { menuID, categoryID: { in: ids } },
      select: { categoryID: true },
    });
    const existSet = new Set(existing.map((x) => x.categoryID));
    const toCreate = ids.filter((id) => !existSet.has(id));

    const created = await prisma.$transaction(
      toCreate.map((categoryID) =>
        prisma.menu_Category.create({ data: { menuID, categoryID } })
      )
    );

    return { success: true, data: created };
  } catch (e) {
    console.error("attachMenuCategories error:", e);
    return { success: false, error: "ไม่สามารถเชื่อมหมวดหมู่กับเมนูได้" };
  }
}

// ถอดหมวดทั้งหมดของเมนูหนึ่งรายการ
export async function detachAllMenuCategories(menuID: string): Promise<CategoryFormData> {
  try {
    if (!menuID) return { success: false, error: "ไม่พบเมนู" };
    await prisma.menu_Category.deleteMany({ where: { menuID } });
    return { success: true, data: { message: "ลบความเชื่อมโยงหมวดหมู่ของเมนูเรียบร้อย" } };
  } catch (e) {
    console.error("detachAllMenuCategories error:", e);
    return { success: false, error: "ไม่สามารถลบความเชื่อมโยงหมวดหมู่ของเมนูได้" };
  }
}

// แทนที่หมวดทั้งหมด (sync)
export async function replaceMenuCategories(
  menuID: string,
  categoryIDs: string[]
): Promise<CategoryFormData> {
  try {
    if (!menuID) return { success: false, error: "ไม่พบเมนู" };
    const ids = Array.from(new Set((categoryIDs || []).filter(Boolean)));

    await prisma.$transaction([
      prisma.menu_Category.deleteMany({ where: { menuID } }),
      ...(ids.map((categoryID) =>
        prisma.menu_Category.create({ data: { menuID, categoryID } })
      )),
    ]);

    return { success: true, data: { menuID, categoryIDs: ids } };
  } catch (e) {
    console.error("replaceMenuCategories error:", e);
    return { success: false, error: "ไม่สามารถอัปเดตหมวดหมู่ของเมนูได้" };
  }
}
