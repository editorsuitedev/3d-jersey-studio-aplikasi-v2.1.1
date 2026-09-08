import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }
  return 'editorsuite-3d-studio-secure-token-secret-fallback-2026';
}

export const TOKEN_EXPIRY = '7d';

export interface AuthJwtPayload {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthJwtPayload;
}

export function generateToken(payload: AuthJwtPayload): string {
  return jwt.sign(payload, getAuthSecret(), { expiresIn: TOKEN_EXPIRY });
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Extract token from HTTP-only cookie or Authorization header
  let token: string | undefined = req.cookies?.auth_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No active session' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getAuthSecret()) as AuthJwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }
}
