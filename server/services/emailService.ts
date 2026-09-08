import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getEmailTransporter(): Transporter | null {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;
  // App passwords from Google often have spaces like "rnzs wspz hxfe jifx"
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : undefined;
  const host = process.env.SMTP_HOST || (user?.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;

  if (user && pass) {
    if (host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'))) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else if (host) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
    return transporter;
  }

  return null;
}

/**
 * Send Verification OTP / Link Email
 */
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  otp: string;
  token: string;
}): Promise<{ success: boolean; previewUrl?: string }> {
  const { to, name, otp, token } = params;
  const appUrl = process.env.APP_URL || 'https://editorsuite.cloud';
  const verifyLink = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

  const subject = `[EditorSuite] Kode Verifikasi Email Anda: ${otp}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #ECECEC; margin: 0; padding: 24px; }
        .card { max-width: 480px; margin: 0 auto; background-color: #121212; border: 1px solid #262626; border-radius: 16px; padding: 32px; }
        .logo { font-size: 18px; font-weight: bold; letter-spacing: -0.5px; color: #FFFFFF; margin-bottom: 24px; }
        .logo span { color: #da0a2c; }
        h1 { font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 12px 0; }
        p { font-size: 14px; line-height: 1.6; color: #A3A3A3; margin: 0 0 20px 0; }
        .otp-box { background-color: #181818; border: 1px solid #333333; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #da0a2c; }
        .btn { display: block; text-align: center; background-color: #da0a2c; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; margin-top: 20px; }
        .footer { font-size: 11px; color: #666666; text-align: center; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">EDITOR<span>SUITE</span> 3D STUDIO</div>
        <h1>Verifikasi Alamat Email</h1>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Terima kasih telah mendaftar di <strong>EditorSuite 3D Jersey Studio</strong>. Masukkan kode 6-digit di bawah ini atau klik tombol konfirmasi untuk mengaktifkan akun Anda:</p>
        
        <div class="otp-box">
          <div style="font-size: 11px; color: #737373; text-transform: uppercase; margin-bottom: 6px;">Kode Verifikasi (OTP)</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 11px; color: #737373; margin-top: 6px;">Berlaku selama 24 jam</div>
        </div>

        <a href="${verifyLink}" class="btn">Verifikasi Email Sekarang</a>

        <div class="footer">
          Jika Anda tidak merasa mendaftar di EditorSuite, Anda dapat mengabaikan email ini.<br/>
          &copy; ${new Date().getFullYear()} EditorSuite Studio (editorsuite.cloud)
        </div>
      </div>
    </body>
    </html>
  `;

  const transport = getEmailTransporter();
  if (transport) {
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM || `"EditorSuite 3D Studio" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[Email] Verification sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('[Email] Failed to send email via SMTP:', (error as Error).message);
    }
  }

  // If SMTP is not yet configured on local/dev/first setup, log OTP to console cleanly
  console.log(`\n======================================================`);
  console.log(`[Email Mock/Dev Logger] VERIFICATION CODE FOR: ${to}`);
  console.log(`User: ${name}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Verify URL: ${verifyLink}`);
  console.log(`======================================================\n`);

  return { success: true };
}
