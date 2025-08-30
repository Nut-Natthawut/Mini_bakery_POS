import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev_secret_change_me";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/staff") || pathname.startsWith("/Owner")) {
    try {
      const sessionToken = await getToken({ req, secret: NEXTAUTH_SECRET, secureCookie: process.env.NODE_ENV === "production" });
      if (!sessionToken) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = (sessionToken as any).role as string | undefined;
      const normalized = role?.toLowerCase();

      if (pathname.startsWith("/admin") && normalized !== "admin") {
        return NextResponse.redirect(new URL("/staff/home", req.url));
      }
      if (pathname.startsWith("/Owner") && normalized !== "owner") {
        return NextResponse.redirect(new URL("/staff/home", req.url));
      }
      if (pathname.startsWith("/staff") && normalized !== "staff") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/Owner/:path*"],
};


