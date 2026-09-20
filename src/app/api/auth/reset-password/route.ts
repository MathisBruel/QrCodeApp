import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail, generateResetPasswordEmail } from '@/lib/email';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const { action, email, token, newPassword } = await req.json();

    if (action === 'request') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ success: true });
      }

      const resetToken = nanoid(32);
      const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpiry,
        },
      });

      const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: email,
        subject: 'Reset Your Password',
        html: generateResetPasswordEmail(resetLink),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'confirm') {
      if (!token || !newPassword) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      }

      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
