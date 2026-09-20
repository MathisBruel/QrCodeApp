import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateQRCodeDataURL } from '@/lib/qr';

const MAX_RANGE_DAYS = 1827; // 5 years, safety cap on payload size

function parseDateOnly(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(value + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

function buildDailyClicks(clicks: { timestamp: Date }[], from: Date, to: Date) {
  const counts = new Map<string, number>();
  for (const click of clicks) {
    const day = click.timestamp.toISOString().split('T')[0];
    counts.set(day, (counts.get(day) || 0) + 1);
  }

  const result: { date: string; count: number }[] = [];
  const totalDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  const cappedFrom =
    totalDays > MAX_RANGE_DAYS
      ? new Date(to.getTime() - (MAX_RANGE_DAYS - 1) * 86400000)
      : from;

  for (let d = new Date(cappedFrom); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
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

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let rangeTo = parseDateOnly(searchParams.get('to')) || today;
    let rangeFrom = parseDateOnly(searchParams.get('from'));

    if (!rangeFrom) {
      const days = Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30);
      rangeFrom = new Date(rangeTo.getTime() - (days - 1) * 86400000);
    }

    if (rangeFrom > rangeTo) {
      [rangeFrom, rangeTo] = [rangeTo, rangeFrom];
    }

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
        dailyClicks: buildDailyClicks(clicks, rangeFrom, rangeTo),
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
