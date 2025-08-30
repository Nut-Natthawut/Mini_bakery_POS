import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { encode as encodeJwt } from "next-auth/jwt";

const LoginSchema = z.object({
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev_secret_change_me";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = LoginSchema.parse(body);

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("User")
      .select("userID, username, passwordHash, role")
      .eq("username", username)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: "ไม่พบบัญชีผู้ใช้" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, data.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const token = await encodeJwt({
      token: { sub: data.userID, role: data.role, username },
      secret: NEXTAUTH_SECRET,
      maxAge: 60 * 60 * 24 * 7,
    });

    const res = NextResponse.json({ role: data.role }, { status: 200 });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const firstIssue = err.issues?.[0]?.message || "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ message: firstIssue }, { status: 400 });
    }
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }, { status: 500 });
  }
}


