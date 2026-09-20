import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@qrapp.local',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export function generateWelcomeEmail(firstName: string, email: string, tempPassword: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #171717; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 1px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 20px; }
          .content { line-height: 1.6; }
          .code-block { background: #f5f5f5; padding: 12px; border-radius: 2px; font-family: monospace; margin: 12px 0; }
          .footer { border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 20px; font-size: 13px; color: #737373; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600;">QR Code Manager</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Your account has been created. Use these credentials to log in:</p>
            <div class="code-block">
              Email: ${email}<br>
              Temporary Password: ${tempPassword}
            </div>
            <p><a href="${process.env.APP_URL}/login" style="color: #000; text-decoration: underline;">Sign in now</a></p>
            <p style="font-size: 13px; color: #737373;">Change your password after first login.</p>
          </div>
          <div class="footer">
            <p>© 2024 QR Code Manager</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateResetPasswordEmail(resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #171717; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 1px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 20px; }
          .content { line-height: 1.6; }
          .button { display: inline-block; background: #000; color: white; padding: 10px 20px; border-radius: 2px; text-decoration: none; margin: 12px 0; }
          .footer { border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 20px; font-size: 13px; color: #737373; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600;">QR Code Manager</h1>
          </div>
          <div class="content">
            <p>You requested a password reset. Click below to create a new password:</p>
            <p><a href="${resetLink}" class="button">Reset Password</a></p>
            <p style="font-size: 13px; color: #737373;">This link expires in 24 hours.</p>
            <p style="font-size: 13px; color: #737373;">If you didn't request this, ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 QR Code Manager</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
