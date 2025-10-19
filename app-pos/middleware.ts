/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// อนุญาตให้ Staff เข้าได้เฉพาะ path เหล่านี้ “ภายใต้ /Owner”
const ALLOWED_STAFF_UNDER_OWNER = [
  '/Owner/home',    // หน้า dashboard สำหรับ staff
  '/Owner/menu',    // เมนูสินค้า
  '/Owner/orders',  // รายการออเดอร์
];

function allow() {
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

function allowedForStaffUnderOwner(pathname: string) {
  const normalizedPath = pathname.toLowerCase();
  for (const rule of ALLOWED_STAFF_UNDER_OWNER) {
    if (rule.endsWith('/')) {
      if (normalizedPath.startsWith(rule)) return true;   // prefix
      continue;
    }

    if (normalizedPath === rule) return true;             // exact match
    if (normalizedPath.startsWith(`${rule}/`)) return true; // sub-path เช่น /owner/orders/123
  }
  return false;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const normalizedPath = pathname.toLowerCase();
  const token = request.cookies.get('token')?.value;

  const isOwnerArea = normalizedPath.startsWith('/owner');
  const isStaffArea = normalizedPath.startsWith('/staff');
  const isApiUser   = normalizedPath.startsWith('/api/user');

  if (!(isOwnerArea || isStaffArea || isApiUser)) return NextResponse.next();

  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  let payload: { role?: 'Owner'|'Staff' } | null = null;
  try { payload = verifyToken(token) as any; } catch { 
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!payload?.role) return NextResponse.redirect(new URL('/login', request.url));

  // สำคัญ: ถ้าเป็น Staff และอยู่ใต้ /Owner → ต้องอยู่ใน allow-list เท่านั้น
  if (payload.role === 'Staff' && isOwnerArea) {
    if (!allowedForStaffUnderOwner(normalizedPath)) {
      return NextResponse.redirect(new URL('/Owner/home', request.url));
      // หรือ rewrite('/unauthorized') ถ้าต้องการหน้า 403
    }
    return allow(); // ผ่านแล้วจบ ไม่ต้องเช็ค Owner-only ต่อ
  }

  // Owner-only: ใต้ /Owner คนที่ไม่ใช่ Owner ห้ามเข้า
  if (isOwnerArea && payload.role !== 'Owner') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Staff-only: ใต้ /staff คนที่ไม่ใช่ Staff ห้ามเข้า
  if (isStaffArea && payload.role !== 'Staff') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return allow();
}

export const config = {
  matcher: ['/Owner/:path*','/staff/:path*','/api/user/:path*'],
};
