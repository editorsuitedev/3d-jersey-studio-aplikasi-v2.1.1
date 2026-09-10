import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const AUTH_SECRET = process.env.AUTH_SECRET || 'editorsuite-3d-jersey-studio-super-secret-key-2026';
export const TOKEN_EXPIRY = '7d';

export interface AuthJwtPayload {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthJwtPayload;
}

export function generateToken(payload: AuthJwtPayload): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: TOKEN_EXPIRY });
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
    const decoded = jwt.verify(token, AUTH_SECRET) as AuthJwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }
}
