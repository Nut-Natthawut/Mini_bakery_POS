import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decode as decodeJwt } from 'next-auth/jwt';

const STAFF_ALLOWED_PATHS = [
  '/Owner/home',    
  '/Owner/menu',    
  '/Owner/sale',    
  '/Owner/orders'   
];

function isAllowedForStaff(pathname: string) {
  return STAFF_ALLOWED_PATHS.some(p => 
    pathname.toLowerCase() === p.toLowerCase() || 
    pathname.toLowerCase().startsWith(p.toLowerCase() + '/')
  );
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // อ่าน token จาก auth_token cookie แทน role
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    // ถอดรหัส token เพื่อเอา role
    const decoded = await decodeJwt({
      token,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev_secret_change_me"
    });
    
    const role = decoded?.role;

    // ถ้าเป็น Staff ให้เข้าถึงได้เฉพาะ paths ที่กำหนด
    if (role === 'Staff' && !isAllowedForStaff(pathname)) {
      url.pathname = '/Owner/home';  // redirect กลับหน้าหลัก
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // ถ้าถอดรหัส token ไม่ได้ ให้ redirect ไปหน้า login
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/owner/:path*', '/api/owner/:path*'],
};