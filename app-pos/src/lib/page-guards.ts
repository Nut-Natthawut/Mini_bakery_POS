// ใช้กับ App Router (Server Component)
import { redirect } from 'next/navigation';
import { getTokenPayload } from '@/lib/auth-helpers';

export async function requireOwnerPage() {
  const p = getTokenPayload();
  if (!p || p.role !== 'Owner') redirect('/unauthorized');
}

export async function requireStaffPage() {
  const p = getTokenPayload();
  if (!p || p.role !== 'Staff') redirect('/unauthorized');
}
