/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// อนุญาตให้ Staff เข้าได้เฉพาะ path เหล่านี้ “ภายใต้ /Owner”
const ALLOWED_STAFF_UNDER_OWNER = [
  '/Owner/menu',     // เพิ่มรายการอื่นค่อยเติมในลิสต์นี้
  // '/Owner/menu/', // ถ้าต้องการให้เป็น prefix ลูกเส้นทางของ /Owner/menu
];

function allowedForStaffUnderOwner(pathname: string) {
  for (const rule of ALLOWED_STAFF_UNDER_OWNER) {
    if (rule.endsWith('/')) {
      if (pathname.startsWith(rule)) return true;   // prefix
    } else {
      if (pathname === rule) return true;           // exact
    }
  }
  return false;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  const isOwnerArea = pathname.startsWith('/Owner');
  const isStaffArea = pathname.startsWith('/staff');
  const isApiUser   = pathname.startsWith('/api/user');

  if (!(isOwnerArea || isStaffArea || isApiUser)) return NextResponse.next();

  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  let payload: { role?: 'Owner'|'Staff' } | null = null;
  try { payload = verifyToken(token) as any; } catch { 
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!payload?.role) return NextResponse.redirect(new URL('/login', request.url));

  // สำคัญ: ถ้าเป็น Staff และอยู่ใต้ /Owner → ต้องอยู่ใน allow-list เท่านั้น
  if (payload.role === 'Staff' && isOwnerArea) {
    if (!allowedForStaffUnderOwner(pathname)) {
      return NextResponse.redirect(new URL('/Owner/menu', request.url));
      // หรือ rewrite('/unauthorized') ถ้าต้องการหน้า 403
    }
    return NextResponse.next(); // ผ่านแล้วจบ ไม่ต้องเช็ค Owner-only ต่อ
  }

  // Owner-only: ใต้ /Owner คนที่ไม่ใช่ Owner ห้ามเข้า
  if (isOwnerArea && payload.role !== 'Owner') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Staff-only: ใต้ /staff คนที่ไม่ใช่ Staff ห้ามเข้า
  if (isStaffArea && payload.role !== 'Staff') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/Owner/:path*','/staff/:path*','/api/user/:path*'],
};
