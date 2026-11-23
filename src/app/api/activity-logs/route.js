import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');

    if (!companyIdParam) {
      return NextResponse.json({ error: 'Le paramètre companyId est obligatoire' }, { status: 400 });
    }

    const companyId = toObjectId(companyIdParam);
    if (!companyId) {
      return NextResponse.json({ error: 'companyId invalide' }, { status: 400 });
    }

    const limit = Math.min(Number(searchParams.get('limit')) || 25, 100);

    const { db } = await getDatabase();
    const logs = await db
      .collection('activity_logs')
      .find({ companyId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Erreur GET /api/activity-logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
