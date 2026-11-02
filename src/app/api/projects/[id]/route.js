import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

async function validateMembers(db, companyId, memberIds) {
  if (!Array.isArray(memberIds)) return { valid: true, formattedIds: undefined };
  const formattedIds = memberIds.map(toObjectId).filter(Boolean);
  if (formattedIds.length === 0) return { valid: true, formattedIds: [] };

  const count = await db.collection('users').countDocuments({
    companyId,
    _id: { $in: formattedIds }
  });
  return { valid: count === formattedIds.length, formattedIds };
}

function buildProjectUpdateFields(body, formattedMemberIds) {
  const fields = { updatedAt: new Date().toISOString() };
  if (body.name !== undefined) fields.name = body.name.trim();
  if (body.description !== undefined) fields.description = body.description.trim();
  if (body.status !== undefined) fields.status = body.status;
  if (body.startDate !== undefined) fields.startDate = body.startDate;
  if (body.targetDate !== undefined) fields.targetDate = body.targetDate;
  if (formattedMemberIds !== undefined) fields.memberIds = formattedMemberIds;
  return fields;
}

export async function GET(request, { params }) {
  try {
    const projectId = toObjectId(params.id);
    if (!projectId) {
      return NextResponse.json({ error: 'Identifiant de projet invalide' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');
    const filter = { _id: projectId };

    if (companyIdParam) {
      const companyId = toObjectId(companyIdParam);
      if (companyId) filter.companyId = companyId;
    }

    const { db } = await getDatabase();
    const project = await db.collection('projects').findOne(filter);

    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable ou accès refusé' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Erreur GET /api/projects/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const projectId = toObjectId(params.id);
    if (!projectId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const body = await request.json();
    const filter = { _id: projectId };
    if (body.companyId) {
      const validCompanyId = toObjectId(body.companyId);
      if (validCompanyId) filter.companyId = validCompanyId;
    }

    const { db } = await getDatabase();
    const existingProject = await db.collection('projects').findOne(filter);
    if (!existingProject) {
      return NextResponse.json({ error: 'Projet introuvable ou accès non autorisé' }, { status: 404 });
    }

    const { valid, formattedIds } = await validateMembers(db, existingProject.companyId, body.memberIds);
    if (!valid) {
      return NextResponse.json({
        error: 'Violation RG-03 : Un utilisateur ne peut être assigné à un projet que s\'il appartient à la même entreprise.'
      }, { status: 400 });
    }

    const updateFields = buildProjectUpdateFields(body, formattedIds);
    const result = await db.collection('projects').findOneAndUpdate(
      filter,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur PUT /api/projects/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const projectId = toObjectId(params.id);
    if (!projectId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');
    if (!companyIdParam) {
      return NextResponse.json({ error: 'companyId obligatoire pour la suppression (RG-01)' }, { status: 400 });
    }

    const companyId = toObjectId(companyIdParam);
    if (!companyId) {
      return NextResponse.json({ error: 'companyId invalide' }, { status: 400 });
    }

    const { db } = await getDatabase();

    // 1. Suppression en cascade des tâches associées au projet (RG-06)
    const tasksDel = await db.collection('tasks').deleteMany({ companyId, projectId });

    // 2. Suppression du projet
    const projectDel = await db.collection('projects').deleteOne({ _id: projectId, companyId });

    if (projectDel.deletedCount === 0) {
      return NextResponse.json({ error: 'Projet introuvable dans cette entreprise' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Projet et toutes ses tâches supprimés avec succès (cascade)',
      tasksDeleted: tasksDel.deletedCount
    });
  } catch (error) {
    console.error('Erreur DELETE /api/projects/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
