import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/app/types/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Register body:", { ...body, password: "[HIDDEN]" });

    
    const { username, password, role, fullName } = RegisterSchema.parse(body);

    
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { message: "This username already exists." },
        { status: 400 }
      );
    }

    
    const passwordHash = await bcrypt.hash(password, 10);

    
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
        fullName,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json(
      { message: "Registration completed", user: safeUser },
      { status: 201 }
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { message: `Registration failed: ${err.message}` },
      { status: 500 }
    );
  }
}
