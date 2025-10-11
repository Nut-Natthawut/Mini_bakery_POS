/* ---------- Config ---------- */
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/* ---------- Validate Image ---------- */
export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { isValid: false, error: "กรุณาเลือกไฟล์รูปภาพ" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, error: "รองรับเฉพาะไฟล์ JPG, PNG, GIF, WEBP" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: "ขนาดไฟล์ต้องไม่เกิน 1MB" };
  }

  return { isValid: true };
}
