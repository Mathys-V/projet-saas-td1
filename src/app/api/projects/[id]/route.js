import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

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
    const { companyId, name, description, status, memberIds, startDate, targetDate } = body;

    const filter = { _id: projectId };
    if (companyId) {
      const validCompanyId = toObjectId(companyId);
      if (validCompanyId) filter.companyId = validCompanyId;
    }

    const { db } = await getDatabase();
    const existingProject = await db.collection('projects').findOne(filter);
    if (!existingProject) {
      return NextResponse.json({ error: 'Projet introuvable ou accès non autorisé' }, { status: 404 });
    }

    const updateFields = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (status !== undefined) updateFields.status = status;
    if (startDate !== undefined) updateFields.startDate = startDate;
    if (targetDate !== undefined) updateFields.targetDate = targetDate;

    if (memberIds !== undefined) {
      const formattedMemberIds = [];
      if (Array.isArray(memberIds)) {
        for (const mId of memberIds) {
          const objId = toObjectId(mId);
          if (objId) formattedMemberIds.push(objId);
        }

        // RG-03 : Vérifier que tous les utilisateurs assignés appartiennent à la même entreprise
        if (formattedMemberIds.length > 0) {
          const validMembersCount = await db.collection('users').countDocuments({
            companyId: existingProject.companyId,
            _id: { $in: formattedMemberIds }
          });

          if (validMembersCount !== formattedMemberIds.length) {
            return NextResponse.json({
              error: 'Violation RG-03 : Un utilisateur ne peut être assigné à un projet que s\'il appartient à la même entreprise.'
            }, { status: 400 });
          }
        }
      }
      updateFields.memberIds = formattedMemberIds;
    }

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
