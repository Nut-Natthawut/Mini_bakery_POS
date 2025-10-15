/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

//แสดงข้อมูล user ปัจจุบัน
export async function GET(req: Request) {
  try {
    const token = cookies().get("token")?.value;
    if (!token)
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );

    const payload = verifyToken(token) as {
      userID: string;
      role?: "Owner" | "Staff";
    } | null;
    if (!payload?.userID)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    // อ่าน query param ถ้ามี เช่น ?role=Staff
    const url = new URL(req.url);
    const role = url.searchParams.get("role") as "Owner" | "Staff" | null;

    const users = await prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        userID: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.userID,
        username: u.username,
        fullName: u.fullName ?? "",
        role: u.role,
        createdAt: u.createdAt,
      }))
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Server error" },
      { status: 500 }
    );
  }
}
// create user
export async function POST(req: Request) {
  try {
    const token = cookies().get("token")?.value;
    if (!token)
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    const payload = verifyToken(token) as {
      userID: string;
      role?: "Owner" | "Staff";
    } | null;
    if (!payload?.userID)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    if (payload.role !== "Owner")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { username, password, fullName, role } = await req.json();
    if (!username)
      return NextResponse.json(
        { message: "username required" },
        { status: 400 }
      );
    if (!password)
      return NextResponse.json(
        { message: "password required" },
        { status: 400 }
      );

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName,
        role: role === "Owner" ? "Owner" : "Staff",
      },
      select: { userID: true },
    });
    return NextResponse.json({ id: created.userID }, { status: 201 });
  } catch (error: any) {
    if (String(error?.code) === "P2002")
      return NextResponse.json(
        { message: "username already exists" },
        { status: 409 }
      );
    return NextResponse.json(
      { message: error.message ?? "Server error" },
      { status: 500 }
    );
  }
}
