import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { encode as encodeJwt } from "next-auth/jwt";
import { LoginSchema } from "@/app/types/auth";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev_secret_change_me";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, userType } = LoginSchema.parse(body);

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("User")
      .select("userID, username, passwordHash, role")
      .eq("username", username)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: "User account not found" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, data.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Password is incorrect" }, { status: 401 });
    }

    const expectedRole = userType === "Owner" ? "Owner" : "Staff";
    if (data.role.toLowerCase() !== expectedRole.toLowerCase()) {
      return NextResponse.json({ 
        message: `You do not have access as ${userType === "Owner" ? "Owner" : "Staff"}` 
      }, { status: 403 });
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
      const firstIssue = err.issues?.[0]?.message || "Incorrect information";
      return NextResponse.json({ message: firstIssue }, { status: 400 });
    }
    return NextResponse.json({ message: "There was an error while logging in." }, { status: 500 });
  }
}


