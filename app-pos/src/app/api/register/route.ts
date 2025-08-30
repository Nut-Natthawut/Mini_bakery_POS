/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RegisterSchema } from "@/app/types/auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Request body:', { ...body, password: '[HIDDEN]' });

    // Validate request body
    const { username, password, role, fullName } = RegisterSchema.parse(body);

    const supabase = createSupabaseServerClient();

    // Test database permission
    const { data: testData, error: testError } = await supabase
      .from('User')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Permission test failed:', testError);
      return NextResponse.json(
        { message: `Database permission error: ${testError.message}` },
        { status: 500 }
      );
    }

    // Check for existing username
    const { data: existing, error: existingError } = await supabase
      .from('User')
      .select('userID')
      .eq('username', username)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { message: `User verification failed: ${existingError.message}` },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { message: 'This username already exists.' },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert({
        userID: crypto.randomUUID(), 
        username,
        passwordHash,
        role,
        fullName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { message: `Failed to create user: ${createError.message}` },
        { status: 500 }
      );
    }

    // Return user data (without passwordHash)
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({
      message: 'Registration completed',
      user: userWithoutPassword
    });

  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { message: `Registration failed: ${err.message}` },
      { status: 500 }
    );
  }
}
