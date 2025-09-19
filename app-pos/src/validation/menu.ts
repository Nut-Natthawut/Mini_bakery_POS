/* eslint-disable @typescript-eslint/no-explicit-any */
// src/validation/menu.ts
import { z } from "zod";
import { ZodError } from "zod";

/* ---------- Schemas ---------- */
export const menuBaseSchema = z.object({
  menuName: z.string().trim().min(1, "กรุณากรอกชื่อเมนู"),
  price: z.number().positive("ราคาต้องมากกว่า 0"),
  menuDetail: z.string().trim().optional().or(z.literal("")),
});

export const createMenuSchema = menuBaseSchema;
export const updateMenuSchema = menuBaseSchema.extend({
  menuID: z.string().min(1, "ไม่พบเมนูที่จะอัปเดต"),
});

/* ---------- Image validation ---------- */
export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export function validateImageFile(file: File | null, required = false) {
  if (!file) {
    if (required) {
      return { isValid: false as const, error: "กรุณาเลือกไฟล์รูปภาพ" };
    }
    return { isValid: true as const }; // ถ้าไม่ required และไม่มีไฟล์ ไม่     ผ่าน
  }

  if (!ALLOWED_TYPES.includes(file.type as any)) {
    return {
      isValid: false as const,
      error: "รองรับเฉพาะไฟล์ JPG, PNG, GIF, WEBP",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false as const,
      error: "ขนาดไฟล์ต้องไม่เกิน 1MB",
    };
  }

  return { isValid: true as const };
}

/* ---------- Helpers: FormData → object ---------- */
export function formDataToCreate(fd: FormData) {
  return {
    menuName: String(fd.get("menuName") || "").trim(),
    price: Number(fd.get("price") || 0),
    menuDetail: (fd.get("menuDetail") as string) || "",
    imageFile: fd.get("imageFile") as File | null,
  };
}

export function formDataToUpdate(fd: FormData) {
  return {
    menuID: String(fd.get("menuID") || ""),
    menuName: String(fd.get("menuName") || "").trim(),
    price: Number(fd.get("price") || 0),
    menuDetail: (fd.get("menuDetail") as string) || "",
    imageFile: fd.get("imageFile") as File | null,
  };
}
/** transform error to message */
export function formatZodError(err: unknown): string {
  // Zod v3: ใช้ issues
  if (err instanceof ZodError) {
    return err.issues
      .map((i) => i.message)
      .filter(Boolean)
      .join("\n");
  }

    // Zod v2: ใช้ errors
  const anyErr = err as any;
  if (anyErr?.errors && Array.isArray(anyErr.errors)) {
    return anyErr.errors
      .map((e: any) => e?.message)
      .filter(Boolean)
      .join("\n");
  }

  // simple string
  if (typeof err === "string") return err;
  if (anyErr?.message) return anyErr.message as string;

  return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
}
