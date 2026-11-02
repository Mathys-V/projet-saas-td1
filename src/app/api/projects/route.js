import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

async function validateProjectMembers(db, companyId, memberIds) {
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return { valid: true, formattedIds: [] };
  }

  const formattedIds = memberIds.map(toObjectId).filter(Boolean);
  if (formattedIds.length === 0) {
    return { valid: true, formattedIds: [] };
  }

  const count = await db.collection('users').countDocuments({
    companyId,
    _id: { $in: formattedIds },
  });

  return {
    valid: count === formattedIds.length,
    formattedIds,
  };
}

export async function GET(request) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');

    if (!companyIdParam) {
      return NextResponse.json({ error: 'Le paramètre companyId est obligatoire (RG-01)' }, { status: 400 });
    }

    const companyId = toObjectId(companyIdParam);
    if (!companyId) {
      return NextResponse.json({ error: 'companyId invalide' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const projects = await db.collection('projects')
      .find({ companyId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Erreur GET /api/projects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureSeedData();
    const body = await request.json();
    const { companyId, name, description, status, memberIds, startDate, targetDate } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Le companyId est obligatoire (RG-01)' }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Le nom du projet est obligatoire' }, { status: 400 });
    }

    const validCompanyId = toObjectId(companyId);
    if (!validCompanyId) {
      return NextResponse.json({ error: 'companyId invalide' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const { valid, formattedIds } = await validateProjectMembers(db, validCompanyId, memberIds);

    if (!valid) {
      return NextResponse.json({
        error: 'Violation RG-03 : Un utilisateur ne peut être assigné à un projet que s\'il appartient à la même entreprise.'
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newProject = {
      _id: new ObjectId(),
      companyId: validCompanyId,
      name: name.trim(),
      description: description?.trim() || '',
      status: status || 'ACTIVE',
      memberIds: formattedIds,
      startDate: startDate || now,
      targetDate: targetDate || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('projects').insertOne(newProject);
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/projects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
