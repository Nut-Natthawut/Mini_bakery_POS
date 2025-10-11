// src/utils/images.ts
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { validateImageFile } from "@/types/imageUtils";

const BUCKET = "menu";
const FOLDER = "menus";

export async function uploadImage(file: File): Promise<string> {
  const supabase = createSupabaseServerClient();

  const { isValid, error } = validateImageFile(file);
  if (!isValid) throw new Error(error);

  const ext = file.name.split(".").pop() || "png";
  const path = `${FOLDER}/${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase
    .storage.from(BUCKET)
    .upload(path, buffer, { contentType: file.type });

  if (upErr) throw new Error(upErr.message || "อัปโหลดรูปภาพล้มเหลว");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl; //  ส่ง URL ที่เปิดดูได้เลย
}

export async function deleteImage(publicUrl: string) {
  const supabase = createSupabaseServerClient();
  // ตัด path ออกจาก public URL
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  if (i === -1) return;
  const path = publicUrl.slice(i + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}
