import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';
import { sendEmail, generateWelcomeEmail } from '@/lib/email';
import { nanoid } from 'nanoid';
import { getClientIP } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, firstName, lastName, role } = await req.json();

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const tempPassword = nanoid(12);
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role,
        passwordHash,
      },
    });

    await sendEmail({
      to: email,
      subject: 'Account Created',
      html: generateWelcomeEmail(firstName, email, tempPassword),
    });

    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'CREATE_USER',
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress: getClientIP(req.headers),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, isActive } = await req.json();

    if (!userId || isActive === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        resourceType: 'USER',
        resourceId: userId,
        ipAddress: getClientIP(req.headers),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
