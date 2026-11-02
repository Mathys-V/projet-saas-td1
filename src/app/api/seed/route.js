import { NextResponse } from 'next/server';
import { ensureSeedData, resetDatabase } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSeedData();
    return NextResponse.json({ success: true, message: 'Données vérifiées / initialisées.' });
  } catch (error) {
    console.error('Erreur seed GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await resetDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur seed POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
