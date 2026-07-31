import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface UserPayload {
  id: string;
  email: string;
}

export interface MagicLinkPayload {
  email: string;
}

export function generateMagicToken(email: string): string {
  return jwt.sign({ email }, env.JWT_SECRET, { expiresIn: '15m' });
}

export function generateSessionToken(user: UserPayload): string {
  return jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken<T>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET) as T;
}
