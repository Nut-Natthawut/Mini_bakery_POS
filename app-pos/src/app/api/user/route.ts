import { NextRequest, NextResponse } from "next/server";
import { decode as decodeJwt } from "next-auth/jwt";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev_secret_change_me";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    const decoded = await decodeJwt({
      token,
      secret: NEXTAUTH_SECRET
    });
    
    return NextResponse.json({ role: decoded?.role || null });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ role: null }, { status: 500 });
  }
}