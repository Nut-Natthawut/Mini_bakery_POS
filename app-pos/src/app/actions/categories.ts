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

