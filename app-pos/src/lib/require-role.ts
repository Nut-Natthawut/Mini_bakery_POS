/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getTokenPayload, JwtPayload } from './auth-helpers';

export function requireRole(roles: Array<'Owner'|'Staff'>): JwtPayload {
  const payload = getTokenPayload();
  if (!payload || !roles.includes(payload.role)) {
    const err = new Error('Forbidden');
    // @ts-ignore
    err.statusCode = 403;
    throw err;
  }
  return payload;
}
