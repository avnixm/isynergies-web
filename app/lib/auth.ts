import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const DEFAULT_PLACEHOLDER = 'your-secret-key-change-this-in-production';

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!raw || raw.trim() === '' || raw === DEFAULT_PLACEHOLDER) {
      throw new Error(
        'JWT_SECRET must be set to a strong random value in production. ' +
        'Do not use the default placeholder.'
      );
    }
  }
  return new TextEncoder().encode(raw || DEFAULT_PLACEHOLDER);
}

const JWT_SECRET = getJwtSecret();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(payload: { userId: number; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as { userId: number; username: string };
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const tokenCookie = cookies
      .split(';')
      .find((c) => c.trim().startsWith('admin_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }
  
  return null;
}

