/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types/type";

const PAGE_PATH = "/Owner/systemconfig";

function serializeConfig(c: any) {
  return {
    configID: c.configID,
    taxRatePct: Number(c.taxRatePct ?? 0),
    defaultDiscountPct: Number(c.defaultDiscountPct ?? 0),
    currency: String(c.currency ?? "THB"),
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : undefined,
  };
}

export async function getSystemConfig(): Promise<ApiResponse<ReturnType<typeof serializeConfig>>> {
  try {
    let c = await prisma.systemConfig.findFirst();
    if (!c) {
      c = await prisma.systemConfig.create({
        data: { taxRatePct: 0, defaultDiscountPct: 0, currency: "THB" },
      });
    }
    return { success: true, data: serializeConfig(c) };
  } catch (e) {
    console.error("getSystemConfig error:", e);
    return { success: false, error: "ไม่สามารถดึงค่าระบบได้" };
  }
}

export async function updateSystemConfig(formData: FormData): Promise<ApiResponse<{ message: string }>> {
  try {
    const tax = Number(formData.get("taxRatePct"));
    const defDisc = Number(formData.get("defaultDiscountPct"));
    const currency = String(formData.get("currency") || "THB").trim() || "THB";

    if (!Number.isFinite(tax) || tax < 0) return { success: false, error: "ภาษีต้องเป็นตัวเลข ≥ 0" };
    if (!Number.isFinite(defDisc) || defDisc < 0) return { success: false, error: "ส่วนลดเริ่มต้นต้องเป็นตัวเลข ≥ 0" };

    const first = await prisma.systemConfig.findFirst();
    if (!first) {
      await prisma.systemConfig.create({ data: { taxRatePct: tax, defaultDiscountPct: defDisc, currency } });
    } else {
      await prisma.systemConfig.update({
        where: { configID: first.configID },
        data: { taxRatePct: tax, defaultDiscountPct: defDisc, currency },
      });
    }

    revalidatePath(PAGE_PATH);
    revalidatePath("/Owner/menu");
    revalidatePath("/Owner/tax_discount");
    return { success: true, data: { message: "บันทึกค่าระบบเรียบร้อย" } };
  } catch (e: any) {
    console.error("updateSystemConfig error:", e);
    return { success: false, error: e?.message || "อัปเดตค่าระบบไม่สำเร็จ" };
  }
}
