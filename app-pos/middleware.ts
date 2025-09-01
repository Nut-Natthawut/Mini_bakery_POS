import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decode as decodeJwt } from 'next-auth/jwt';

// กำหนด path ที่ Staff สามารถเข้าถึงได้เท่านั้น
// ตัดฟีเจอร์ editmenu, salesreport, employees และ tax/discount สำหรับ Staff
const STAFF_ALLOWED_PATHS = [
  '/Owner/home',    // หน้าหลัก
  '/Owner/sale',    // หน้าขาย
  '/Owner/menu'    // หน้าเมนู (แสดงอย่างเดียว)
];

// ฟีเจอร์ที่ Staff ไม่สามารถเข้าถึงได้
const STAFF_BLOCKED_PATHS = [
  '/Owner/editmenu',
  '/Owner/employees',
  '/Owner/tax_discount',
  '/Owner/sale'
];

function isAllowedForStaff(pathname: string) {
  // ตรวจสอบว่า path อยู่ใน STAFF_ALLOWED_PATHS หรือไม่
  const isAllowed = STAFF_ALLOWED_PATHS.some(p => 
    pathname.toLowerCase() === p.toLowerCase() || 
    pathname.toLowerCase().startsWith(p.toLowerCase() + '/')
  );
  
  // ตรวจสอบว่า path อยู่ใน STAFF_BLOCKED_PATHS หรือไม่
  const isBlocked = STAFF_BLOCKED_PATHS.some(p => 
    pathname.toLowerCase() === p.toLowerCase() || 
    pathname.toLowerCase().startsWith(p.toLowerCase() + '/')
  );
  
  // อนุญาตเฉพาะ path ที่อยู่ใน STAFF_ALLOWED_PATHS และไม่อยู่ใน STAFF_BLOCKED_PATHS
  return isAllowed && !isBlocked;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // ข้ามการตรวจสอบสำหรับหน้า login และ register
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    const decoded = await decodeJwt({
      token,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev_secret_change_me"
    });
    
    const role = decoded?.role;

    // ถ้าเป็น Staff และพยายามเข้าถึง path ที่ไม่ได้รับอนุญาต
    if (role === 'Staff' && !isAllowedForStaff(pathname)) {
      // redirect ไปที่หน้า home ที่ Staff มีสิทธิ์เข้าถึง
      url.pathname = '/Owner/home';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

// แก้ไข matcher ให้ครอบคลุมทุก path ที่ต้องการตรวจสอบ
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};