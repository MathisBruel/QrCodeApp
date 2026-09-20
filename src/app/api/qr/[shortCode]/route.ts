import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseUserAgent, getClientIP } from '@/lib/analytics';
import { generateQRCodeDataURL, validateSlug } from '@/lib/qr';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params;

    const qrCode = await prisma.qRCode.findUnique({
      where: { shortCode },
    });

    if (!qrCode || !qrCode.isActive) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 });
    }

    if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
      return NextResponse.json({ error: 'QR Code expired' }, { status: 410 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const deviceInfo = parseUserAgent(userAgent);
    const ipAddress = getClientIP(req.headers);

    await prisma.click.create({
      data: {
        qrCodeId: qrCode.id,
        userAgent: userAgent || undefined,
        ipAddress,
        deviceType: deviceInfo.deviceType,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
        browserName: deviceInfo.browserName,
        browserVersion: deviceInfo.browserVersion,
      },
    });

    return NextResponse.redirect(qrCode.targetUrl, 301);
  } catch (error) {
    console.error('QR tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { shortCode: string } }
) {
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

    const existing = await prisma.qRCode.findUnique({ where: { shortCode: params.shortCode } });

    if (!existing || existing.createdBy !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, description, targetUrl, customSlug } = await req.json();

    if (!targetUrl || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let shortCode = existing.shortCode;

    if (customSlug && customSlug !== existing.shortCode) {
      const slugError = validateSlug(customSlug);
      if (slugError) {
        return NextResponse.json({ error: slugError }, { status: 400 });
      }

      const taken = await prisma.qRCode.findUnique({ where: { shortCode: customSlug } });
      if (taken) {
        return NextResponse.json({ error: 'This link is already taken' }, { status: 409 });
      }

      shortCode = customSlug;
    }

    const updated = await prisma.qRCode.update({
      where: { id: existing.id },
      data: { title, description, targetUrl, shortCode },
    });

    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'UPDATE_QR_CODE',
        resourceType: 'QR_CODE',
        resourceId: updated.id,
        ipAddress: getClientIP(req.headers),
      },
    });

    const trackingUrl = `${process.env.APP_URL}/api/qr/${updated.shortCode}`;
    const qrDataURL = await generateQRCodeDataURL(trackingUrl);

    return NextResponse.json({
      success: true,
      qrCode: {
        id: updated.id,
        shortCode: updated.shortCode,
        title: updated.title,
        description: updated.description,
        targetUrl: updated.targetUrl,
        trackingUrl,
        qrDataURL,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error('Update QR error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
