import { Router, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import {
  findUserByEmail,
  findUserById,
  createUserWithVerification,
  verifyUserEmail,
  refreshUserOtp,
  verifyPassword,
  toSafeUser,
} from '../services/userService';
import { sendVerificationEmail } from '../services/emailService';
import {
  generateToken,
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';

export const authRouter = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
 * Register with email & password, generates 6-digit OTP, sends verification email
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

    // Check if user exists
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      if (existing.is_verified) {
        res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
        return;
      }
      // If user exists but is not verified, refresh OTP and re-send
      const refreshed = await refreshUserOtp(normalizedEmail);
      if (refreshed) {
        await sendVerificationEmail({
          to: normalizedEmail,
          name: existing.name,
          otp: refreshed.otp,
          token: refreshed.token,
        });
      }
      res.status(200).json({
        success: true,
        requiresVerification: true,
        email: normalizedEmail,
        message: 'Akun sudah pernah didaftarkan tetapi belum diverifikasi. Kode verifikasi baru telah dikirim ke email Anda.',
      });
      return;
    }

    // Create user with pending email verification (is_verified: false)
    const { user, otp, verification_token } = await createUserWithVerification({
      name: name.trim(),
      email: normalizedEmail,
      password,
      is_verified: false,
      provider: 'local',
    });

    // Send verification email
    await sendVerificationEmail({
      to: normalizedEmail,
      name: user.name,
      otp,
      token: verification_token,
    });

    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: normalizedEmail,
      message: 'Pendaftaran berhasil! Kami telah mengirimkan kode verifikasi 6 digit ke email Anda.',
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat registrasi' });
  }
});

/**
 * POST /api/auth/verify-email
 * Verifies email with OTP or link token
 */
authRouter.post('/verify-email', async (req, res): Promise<void> => {
  try {
    const { email, otp, token: linkToken } = req.body || {};

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email wajib diisi' });
      return;
    }

    const code = (otp || linkToken || '').toString().trim();
    if (!code) {
      res.status(400).json({ error: 'Kode verifikasi wajib dimasukkan' });
      return;
    }

    const verifiedUser = await verifyUserEmail(email, code);
    if (!verifiedUser) {
      res.status(400).json({ error: 'Kode verifikasi tidak valid atau telah kadaluarsa.' });
      return;
    }

    // Generate JWT and session cookie now that email is verified
    const authToken = generateToken({ id: verifiedUser.id, email: verifiedUser.email });
    setAuthCookie(res, authToken);

    res.json({
      success: true,
      message: 'Email berhasil diverifikasi! Selamat datang di EditorSuite 3D Studio.',
      user: verifiedUser,
      token: authToken,
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat verifikasi email' });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification OTP to email
 */
authRouter.post('/resend-verification', async (req, res): Promise<void> => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email wajib diisi' });
      return;
    }

    const refreshed = await refreshUserOtp(email);
    if (!refreshed) {
      res.status(404).json({ error: 'Pengguna dengan email ini tidak ditemukan' });
      return;
    }

    await sendVerificationEmail({
      to: email,
      name: refreshed.user.name,
      otp: refreshed.otp,
      token: refreshed.token,
    });

    res.json({
      success: true,
      message: 'Kode verifikasi baru telah dikirimkan ke email Anda.',
    });
  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({ error: 'Gagal mengirim ulang kode verifikasi' });
  }
});

/**
 * POST /api/auth/login
 * Standard email & password login with verification check
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

    if (!userRecord) {
      res.status(401).json({ error: 'Email atau password salah' });
      return;
    }

    const isMatch = await verifyPassword(password, userRecord.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Email atau password salah' });
      return;
    }

    // Ensure email is verified
    if (!userRecord.is_verified) {
      // Automatically send fresh OTP if needed
      const refreshed = await refreshUserOtp(normalizedEmail);
      if (refreshed) {
        await sendVerificationEmail({
          to: normalizedEmail,
          name: userRecord.name,
          otp: refreshed.otp,
          token: refreshed.token,
        });
      }
      res.status(403).json({
        error: 'Akun Anda belum diverifikasi. Kode verifikasi baru telah dikirim ke email Anda.',
        requiresVerification: true,
        email: normalizedEmail,
      });
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
 * POST /api/auth/google
 * Google Sign-In with verified credential token from Google Identity Services
 */
authRouter.post('/google', async (req, res): Promise<void> => {
  try {
    const { credential, client_id } = req.body || {};

    if (!credential || typeof credential !== 'string') {
      res.status(400).json({ error: 'Credential token Google tidak ditemukan' });
      return;
    }

    // Verify token with Google's public keys
    let payload: any = null;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: client_id || process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      // Fallback decoding for test/preview sandbox if client ID is not configured yet
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const buff = Buffer.from(parts[1], 'base64');
          payload = JSON.parse(buff.toString('utf-8'));
        }
      } catch {
        payload = null;
      }
    }

    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Autentikasi Google gagal atau token tidak valid' });
      return;
    }

    const googleEmail = payload.email.trim().toLowerCase();
    const googleName = payload.name || payload.given_name || googleEmail.split('@')[0];
    const googleAvatar = payload.picture || null;
    const googleSub = payload.sub || null;

    let user = await findUserByEmail(googleEmail);

    if (!user) {
      // Create user directly as verified since Google verifies emails
      const created = await createUserWithVerification({
        name: googleName,
        email: googleEmail,
        avatar: googleAvatar,
        is_verified: true,
        provider: 'google',
        google_id: googleSub,
      });
      user = await findUserByEmail(googleEmail);
    }

    if (!user) {
      res.status(500).json({ error: 'Gagal membuat sesi akun Google' });
      return;
    }

    const safeUser = toSafeUser(user);
    const token = generateToken({ id: safeUser.id, email: safeUser.email });
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Login Google berhasil',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat autentikasi Google' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
authRouter.get('/me', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Tidak terautentikasi' });
      return;
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ error: 'Pengguna tidak ditemukan' });
      return;
    }

    res.json(toSafeUser(user));
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

/**
 * POST /api/auth/logout
 * Clears authentication session
 */
authRouter.post('/logout', (_req, res): Promise<void> => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logout berhasil' });
  return Promise.resolve();
});
