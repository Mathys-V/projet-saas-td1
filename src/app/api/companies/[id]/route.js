import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await ensureSeedData();
    const companyId = toObjectId(params.id);
    if (!companyId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const company = await db.collection('companies').findOne({ _id: companyId });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Erreur GET /api/companies/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const companyId = toObjectId(params.id);
    if (!companyId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { name, industry, description, themeColor } = body;

    const updateFields = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateFields.name = name.trim();
      updateFields.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (industry !== undefined) updateFields.industry = industry.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (themeColor !== undefined) updateFields.themeColor = themeColor;

    const { db } = await getDatabase();
    const result = await db.collection('companies').findOneAndUpdate(
      { _id: companyId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur PUT /api/companies/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const companyId = toObjectId(params.id);
    if (!companyId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const { db } = await getDatabase();

    // Suppression en cascade séquentielle (compatible Standalone sans replica set)
    // 1. Supprimer toutes les tâches de l'entreprise
    const tasksDel = await db.collection('tasks').deleteMany({ companyId });

    // 2. Supprimer tous les projets de l'entreprise
    const projectsDel = await db.collection('projects').deleteMany({ companyId });

    // 3. Supprimer tous les utilisateurs de l'entreprise
    const usersDel = await db.collection('users').deleteMany({ companyId });

    // 4. Supprimer l'entreprise elle-même
    const companyDel = await db.collection('companies').deleteOne({ _id: companyId });

    if (companyDel.deletedCount === 0) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Entreprise et toutes ses données associées supprimées avec succès (cascade)',
      details: {
        tasksDeleted: tasksDel.deletedCount,
        projectsDeleted: projectsDel.deletedCount,
        usersDeleted: usersDel.deletedCount,
      }
    });
  } catch (error) {
    console.error('Erreur DELETE /api/companies/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
