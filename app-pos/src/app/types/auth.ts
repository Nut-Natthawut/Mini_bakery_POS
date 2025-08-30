import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(4, "ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  role: z.enum(['Owner', 'Staff']).refine(
    (value) => value === 'Owner' || value === 'Staff',
    { message: "Role ต้องเป็น Owner หรือ Staff เท่านั้น" }
  ),
  fullName: z.string().min(1, "กรุณาระบุชื่อ-นามสกุล")
});