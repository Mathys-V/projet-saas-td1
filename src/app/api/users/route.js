import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';
import { hashPassword } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');

    if (!companyIdParam) {
      return NextResponse.json({ error: 'Le paramètre companyId est obligatoire (RG-01 Isolation Multi-Tenant)' }, { status: 400 });
    }

    const companyId = toObjectId(companyIdParam);
    if (!companyId) {
      return NextResponse.json({ error: 'Identifiant companyId invalide' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const users = await db.collection('users')
      .find({ companyId })
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erreur GET /api/users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureSeedData();
    const body = await request.json();
    const { companyId, fullName, email, role, jobTitle, avatarColor, password } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Le companyId est obligatoire (RG-01)' }, { status: 400 });
    }
    if (!fullName || !email) {
      return NextResponse.json({ error: 'Nom complet et e-mail sont obligatoires' }, { status: 400 });
    }

    const validCompanyId = toObjectId(companyId);
    if (!validCompanyId) {
      return NextResponse.json({ error: 'companyId invalide' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const company = await db.collection('companies').findOne({ _id: validCompanyId });
    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.collection('users').findOne({ companyId: validCompanyId, email: cleanEmail });
    if (existing) {
      return NextResponse.json({ error: 'Un collaborateur avec cette adresse e-mail existe déjà dans cette entreprise' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newUser = {
      _id: new ObjectId(),
      companyId: validCompanyId,
      fullName: fullName.trim(),
      email: cleanEmail,
      role: role || 'MEMBER',
      jobTitle: jobTitle ? jobTitle.trim() : 'Collaborateur',
      avatarColor: avatarColor || '#4F46E5',
      password: hashPassword(password || 'password123'),
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').insertOne(newUser);

    const safeUser = { ...newUser };
    delete safeUser.password;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
