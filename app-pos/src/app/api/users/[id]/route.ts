/* eslint-disable @typescript-eslint/no-explicit-any */
// (UPDATE + DELETE)
import { NextResponse as NR } from "next/server";
import { cookies as CK } from "next/headers";
import { verifyToken as VT } from "@/lib/auth";
import prisma2 from "@/lib/prisma";
import bcryptjs from "bcryptjs";

// PUT /api/users/[id]
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = CK().get("token")?.value;
    if (!token)
      return NR.json({ message: "Not authenticated" }, { status: 401 });
    const payload = VT(token) as {
      userID: string;
      role?: "Owner" | "Staff";
    } | null;
    if (!payload?.userID)
      return NR.json({ message: "Invalid token" }, { status: 401 });

    const { fullName, role, newPassword } = await req.json();
    const data: any = {};
    if (typeof fullName === "string") data.fullName = fullName;
    if (role === "Owner" || role === "Staff") data.role = role;
    if (newPassword) data.passwordHash = await bcryptjs.hash(newPassword, 10);

    if (payload.role !== "Owner" && payload.userID !== params.id)
      return NR.json({ message: "Forbidden" }, { status: 403 });

    await prisma2.user.update({
        where: {
            userID: params.id 
        }, data 
    });

    return NR.json({ ok: true });
  } catch (error: any) {
    
    return NR.json(
      { message: error.message ?? "Server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = CK().get("token")?.value;
    if (!token)
      return NR.json({ message: "Not authenticated" }, { status: 401 });
    const payload = VT(token) as { role?: "Owner" | "Staff" } | null;
    if (payload?.role !== "Owner")
      return NR.json({ message: "Forbidden" }, { status: 403 });

    const target = await prisma2.user.findUnique({
      where: { userID: params.id },
      select: { role: true },
    });
    if (!target) return NR.json({ message: "User not found" }, { status: 404 });

    if (target.role === "Owner") {
      const owners = await prisma2.user.count({ where: { role: "Owner" } });
      if (owners <= 1)
        return NR.json(
          { message: "Cannot delete the last Owner" },
          { status: 409 }
        );
    }

    await prisma2.user.delete({ where: { userID: params.id } });
    return NR.json({ ok: true });
  } catch (error: any) {
    return NR.json(
      { message: error.message ?? "Server error" },
      { status: 500 }
    );
  }
}
