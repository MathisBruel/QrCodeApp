import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateQRCodeDataURL, generateShortCode, validateSlug } from '@/lib/qr';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { targetUrl, title, description, customSlug } = await req.json();

    if (!targetUrl || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let shortCode = generateShortCode();

    if (customSlug) {
      const slugError = validateSlug(customSlug);
      if (slugError) {
        return NextResponse.json({ error: slugError }, { status: 400 });
      }

      const existing = await prisma.qRCode.findUnique({ where: { shortCode: customSlug } });
      if (existing) {
        return NextResponse.json({ error: 'This link is already taken' }, { status: 409 });
      }

      shortCode = customSlug;
    }
    const trackingUrl = `${process.env.APP_URL}/api/qr/${shortCode}`;
    const qrDataURL = await generateQRCodeDataURL(trackingUrl);

    const qrCode = await prisma.qRCode.create({
      data: {
        shortCode,
        targetUrl,
        title,
        description,
        createdBy: payload.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'CREATE_QR_CODE',
        resourceType: 'QR_CODE',
        resourceId: qrCode.id,
      },
    });

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        shortCode: qrCode.shortCode,
        title: qrCode.title,
        description: qrCode.description,
        targetUrl: qrCode.targetUrl,
        trackingUrl,
        qrDataURL,
        createdAt: qrCode.createdAt,
      },
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
