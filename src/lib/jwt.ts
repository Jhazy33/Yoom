import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  allowedFolders?: string[];
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as 'admin' | 'user',
      allowedFolders: payload.allowedFolders as string[] | undefined
    };
  } catch {
    return null;
  }
}
