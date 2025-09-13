"use server";

import { prisma } from "@/lib/prisma";

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function addCategory(name: string) {
  return await prisma.category.create({
    data: { categoryName: name },
  });
}

export async function updateCategory(id: string, name: string) {
  return await prisma.category.update({
    where: { categoryID: id },
    data: { categoryName: name },
  });
}

export async function deleteCategory(id: string) {
  return await prisma.category.delete({
    where: { categoryID: id },
  });
}
