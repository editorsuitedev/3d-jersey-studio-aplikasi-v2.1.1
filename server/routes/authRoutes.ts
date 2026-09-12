import { Router, Request, Response } from 'express';
import {
  findUserByEmail,
  findUserById,
  findUserByGoogleId,
  createUser,
  verifyPassword,
  recordUserLogin,
  toSafeUser,
  updateUser,
} from '../services/userService';
import {
  generateToken,
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';
import { db } from '../database/db';

export const authRouter = Router();

// Helper to extract client IP address
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

// Helper to set secure HTTP-only cookie
function setAuthCookie(res: Response, token: string): void {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

function clearAuthCookie(res: Response): void {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 */
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword } = req.body || {};
    const ipAddress = getClientIp(req);

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Nama minimal harus 2 karakter' });
      return;
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ error: 'Format email tidak valid' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password minimal harus 6 karakter' });
      return;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Konfirmasi password tidak cocok' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
      return;
    }

    // Create user in database (hashed with bcrypt, NEVER plaintext)
    const user = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      password,
      ip_address: ipAddress,
      email_verified: false,
    });

    // Log usage
    await db.logUsage({
      user_id: user.id,
      model_id: 'system',
      action: 'register',
      metadata: { ip: ipAddress },
    });

    const token = generateToken({ id: user.id, email: user.email });
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      user,
      token,
    });
  } catch (error) {
    console.error('[Auth] Error during registration:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat registrasi' });
  }
});

/**
 * POST /api/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body || {};
    const ipAddress = getClientIp(req);

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email dan password wajib diisi' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRecord = await findUserByEmail(normalizedEmail);

    if (!userRecord) {
      res.status(401).json({ error: 'Email atau password salah' });
      return;
    }

    const isMatch = await verifyPassword(password, userRecord.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Email atau password salah' });
      return;
    }

    // Record login timestamp and client IP
    const updatedUser = await recordUserLogin(userRecord.id, ipAddress);
    const safeUser = updatedUser || toSafeUser(userRecord);

    // Log usage
    await db.logUsage({
      user_id: safeUser.id,
      model_id: 'system',
      action: 'login',
      metadata: { ip: ipAddress },
    });

    const token = generateToken({ id: safeUser.id, email: safeUser.email });
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Login berhasil',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('[Auth] Error during login:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat login' });
  }
});

/**
 * POST /api/auth/google
 */
authRouter.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { google_id, email, name } = req.body || {};
    const ipAddress = getClientIp(req);

    const targetEmail = (email || 'google.designer@gmail.com').trim().toLowerCase();
    const targetName = (name || 'Google Designer').trim();
    const targetGoogleId = google_id || `g_${Date.now()}`;

    let userRecord = await findUserByGoogleId(targetGoogleId);
    if (!userRecord) {
      userRecord = await findUserByEmail(targetEmail);
    }

    let safeUser;
    if (userRecord) {
      // Update Google ID and login info
      await updateUser(userRecord.id, {
        google_id: targetGoogleId,
        email_verified: true,
        last_login: new Date().toISOString(),
        ip_address: ipAddress,
      });
      const refreshed = await findUserById(userRecord.id);
      safeUser = refreshed ? toSafeUser(refreshed) : toSafeUser(userRecord);
    } else {
      // Auto-create user for Google OAuth
      safeUser = await createUser({
        name: targetName,
        email: targetEmail,
        password: `google_auth_${Date.now()}_${Math.random()}`,
        google_id: targetGoogleId,
        email_verified: true,
        ip_address: ipAddress,
      });
      await recordUserLogin(safeUser.id, ipAddress);
    }

    const token = generateToken({ id: safeUser.id, email: safeUser.email });
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Login dengan Google berhasil',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('[Auth] Error during Google login:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat masuk dengan Google' });
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', (_req, res): void => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logout berhasil' });
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRecord = await findUserById(req.user.id);
    if (!userRecord) {
      clearAuthCookie(res);
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.json(toSafeUser(userRecord));
  } catch (error) {
    console.error('[Auth] Error fetching current user:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});
