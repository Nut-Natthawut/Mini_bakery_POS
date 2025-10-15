/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export type JwtPayload = { userID: string; role: 'Owner'|'Staff'; [k: string]: any };

export function getTokenPayload(): JwtPayload | null {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try { return verifyToken(token) as JwtPayload; } catch { return null; }
}
