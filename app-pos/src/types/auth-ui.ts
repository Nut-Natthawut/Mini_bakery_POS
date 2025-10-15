// src/types/auth-ui.ts
import { z } from "zod";
import { RegisterSchema } from "./auth";

// ฟอร์ม "เพิ่มผู้ใช้": ใช้ RegisterSchema เดิมจาก backend และเพิ่ม confirmPassword
export const UIRegisterSchema = RegisterSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

export type UIRegisterInput = z.infer<typeof UIRegisterSchema>;

// ฟอร์ม "แก้ไขผู้ใช้": เปลี่ยนชื่อ/บทบาท/รหัสผ่านใหม่ (รหัสผ่านใหม่เป็น optional)
export const UIUpdateUserSchema = z.object({
  fullName: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  role: z.enum(["Owner", "Staff"]).default("Staff"),
  newPassword: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 6, {
      message: "Password must be at least 6 characters.",
    }),
});

export type UIUpdateUserInput = z.infer<typeof UIUpdateUserSchema>;

/** helper: แปลงค่าจาก UIRegisterInput -> payload สำหรับ POST /api/users */
export function toCreatePayload(ui: UIRegisterInput) {
  return {
    username: ui.username.trim(),
    password: ui.password,
    role: ui.role,
    fullName: ui.fullName, // undefined ได้ตาม schema backend
  };
}

/** helper: แปลงค่าจาก UIUpdateUserInput -> payload สำหรับ PUT /api/users/[id] */
export function toUpdatePayload(ui: UIUpdateUserInput) {
  return {
    fullName: ui.fullName,
    role: ui.role,
    newPassword: ui.newPassword || undefined,
  };
}
