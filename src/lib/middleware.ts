import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export function withAuth(handler: Function) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    (req as any).user = payload;
    return handler(req);
  };
}

export function withAdminAuth(handler: Function) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    (req as any).user = payload;
    return handler(req);
  };
}

export function withSuperAdminAuth(handler: Function) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    (req as any).user = payload;
    return handler(req);
  };
}
