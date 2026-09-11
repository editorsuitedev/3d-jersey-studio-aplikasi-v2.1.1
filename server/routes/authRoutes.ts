import { Router, Response } from 'express';
import {
  findUserByEmail,
  findUserById,
  createUser,
  verifyPassword,
  toSafeUser,
} from '../services/userService';
import {
  generateToken,
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';

export const authRouter = Router();

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

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 */
authRouter.post('/register', async (req, res): Promise<void> => {
  try {
    const { name, email, password, confirmPassword } = req.body || {};

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

    // Create user in database (hashed with bcrypt)
    const user = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    // Do not set auth cookie on registration because email verification is required
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan verifikasi email Anda sebelum masuk.',
      user,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat registrasi' });
  }
});

/**
 * POST /api/auth/login
 */
authRouter.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email dan password wajib diisi' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRecord = await findUserByEmail(normalizedEmail);

    // Constant-time-like rejection on failure: generic message per specification
    if (!userRecord) {
      res.status(401).json({ error: 'Email atau password salah' });
      return;
    }

    const isMatch = await verifyPassword(password, userRecord.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Email atau password salah' });
      return;
    }

    const safeUser = toSafeUser(userRecord);
    const token = generateToken({ id: safeUser.id, email: safeUser.email });
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Login berhasil',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat login' });
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
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});
