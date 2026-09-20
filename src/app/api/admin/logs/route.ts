import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action');

    const where = action ? { action } : {};

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        user: log.user,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
