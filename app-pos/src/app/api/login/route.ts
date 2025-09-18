import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password, loginAs } = await req.json(); 

    if (!username || !password || !loginAs) {
      return NextResponse.json(
        { message: "Username, password and role selection required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    
    if (user.role !== loginAs) {
      return NextResponse.json(
        { message: `You don't have ${loginAs} access. Your role is ${user.role}.` },
        { status: 403 }
      );
    }

    const token = signToken({ userID: user.userID, role: user.role });
    setAuthCookie(token);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json(
      { 
        message: "Login successful", 
        user: safeUser,
        redirectUrl: user.role === 'Owner' ? '/Owner' : '/employee'
      },
      { status: 200 }
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { message: `Login failed: ${err.message}` },
      { status: 500 }
    );
  }
}
