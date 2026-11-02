import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSeedData();
    const { db } = await getDatabase();
    const companies = await db.collection('companies').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Erreur GET /api/companies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureSeedData();
    const body = await request.json();
    const { name, industry, description, themeColor } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Le nom de l\'entreprise est obligatoire' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const now = new Date().toISOString();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCompany = {
      _id: new ObjectId(),
      name: name.trim(),
      slug,
      industry: industry?.trim() || 'Général',
      description: description?.trim() || '',
      themeColor: themeColor || '#4F46E5',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('companies').insertOne(newCompany);
    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/companies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
