import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateQRCodeDataURL } from '@/lib/qr';

function buildDailyClicks(clicks: { timestamp: Date }[], days: number) {
  const counts = new Map<string, number>();
  for (const click of clicks) {
    const day = click.timestamp.toISOString().split('T')[0];
    counts.set(day, (counts.get(day) || 0) + 1);
  }

  const result: { date: string; count: number }[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push({ date: key, count: counts.get(key) || 0 });
  }

  return result;
}

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const qrCodeId = searchParams.get('qrCodeId');
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30));

    if (qrCodeId) {
      const qrCode = await prisma.qRCode.findUnique({
        where: { id: qrCodeId },
      });

      if (!qrCode || qrCode.createdBy !== payload.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const clicks = await prisma.click.findMany({
        where: { qrCodeId },
        orderBy: { timestamp: 'desc' },
      });

      const stats = {
        totalClicks: clicks.length,
        topDevices: Object.entries(
          clicks.reduce((acc, click) => {
            const device = click.deviceType || 'unknown';
            acc[device] = (acc[device] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5),
        topBrowsers: Object.entries(
          clicks.reduce((acc, click) => {
            const browser = click.browserName || 'unknown';
            acc[browser] = (acc[browser] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5),
        dailyClicks: buildDailyClicks(clicks, days),
      };

      return NextResponse.json({ success: true, stats });
    }

    const userQRCodes = await prisma.qRCode.findMany({
      where: { createdBy: payload.userId },
    });

    const allClicks = await prisma.click.findMany({
      where: {
        qrCode: {
          createdBy: payload.userId,
        },
      },
    });

    const globalStats = {
      totalQRCodes: userQRCodes.length,
      totalClicks: allClicks.length,
      averageClicks: userQRCodes.length > 0 ? allClicks.length / userQRCodes.length : 0,
      qrCodes: await Promise.all(
        userQRCodes.map(async (qr) => {
          const trackingUrl = `${process.env.APP_URL}/${qr.shortCode}`;
          return {
            id: qr.id,
            title: qr.title,
            description: qr.description,
            shortCode: qr.shortCode,
            targetUrl: qr.targetUrl,
            trackingUrl,
            qrDataURL: await generateQRCodeDataURL(trackingUrl),
            clicks: allClicks.filter((c) => c.qrCodeId === qr.id).length,
            createdAt: qr.createdAt,
          };
        })
      ),
    };

    return NextResponse.json({ success: true, stats: globalStats });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
