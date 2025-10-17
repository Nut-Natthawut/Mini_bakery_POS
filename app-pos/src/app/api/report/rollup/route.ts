import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/report/rollup?day=YYYY-MM-DD
// ถ้าไม่ส่ง day จะใช้วันปัจจุบันตามเวลาไทย
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day") ?? new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await prisma.$executeRawUnsafe(`SELECT rollup_daily_sales('${day}'::date);`);
    return NextResponse.json({ success: true, day });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}

// POST /api/report/rollup  { day?: 'YYYY-MM-DD' }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const day: string = body?.day || new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await prisma.$executeRawUnsafe(`SELECT rollup_daily_sales('${day}'::date);`);
    return NextResponse.json({ success: true, day });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}

