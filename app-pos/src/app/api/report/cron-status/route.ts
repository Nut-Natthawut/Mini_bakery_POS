import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/report/cron-status
export async function GET(_req: NextRequest) {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT jobid, jobname, schedule, command, active FROM cron.job WHERE jobname = 'mini_pos_daily_report';`
    );
    return NextResponse.json({ success: true, jobs: rows });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || String(e),
        hint: "Ensure pg_cron extension is installed and accessible (cron.job table)",
      },
      { status: 500 }
    );
  }
}

