import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export async function GET(request, { params }) {
  try {
    const taskId = toObjectId(params.id);
    if (!taskId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');
    const filter = { _id: taskId };

    if (companyIdParam) {
      const companyId = toObjectId(companyIdParam);
      if (companyId) filter.companyId = companyId;
    }

    const { db } = await getDatabase();
    const task = await db.collection('tasks').findOne(filter);

    if (!task) {
      return NextResponse.json({ error: 'Tâche introuvable ou accès non autorisé' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Erreur GET /api/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const taskId = toObjectId(params.id);
    if (!taskId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const body = await request.json();
    const {
      companyId,
      title,
      description,
      status,
      priority,
      assigneeId,
      order,
      dueDate,
      tags,
      subtasks,
    } = body;

    const filter = { _id: taskId };
    if (companyId) {
      const validCompanyId = toObjectId(companyId);
      if (validCompanyId) filter.companyId = validCompanyId;
    }

    const { db } = await getDatabase();
    const existingTask = await db.collection('tasks').findOne(filter);
    if (!existingTask) {
      return NextResponse.json({ error: 'Tâche introuvable ou accès refusé' }, { status: 404 });
    }

    const updateFields = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: `Statut invalide. Attendu: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
      }
      updateFields.status = status;
    }
    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return NextResponse.json({ error: `Priorité invalide. Attendue: ${VALID_PRIORITIES.join(', ')}` }, { status: 400 });
      }
      updateFields.priority = priority;
    }
    if (order !== undefined) updateFields.order = Number(order);
    if (dueDate !== undefined) updateFields.dueDate = dueDate;
    if (tags !== undefined) {
      updateFields.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
    }
    if (subtasks !== undefined) {
      updateFields.subtasks = Array.isArray(subtasks)
        ? subtasks.map((st, index) => ({
            _id: st._id || `sub_${Date.now()}_${index}`,
            title: st.title || '',
            completed: Boolean(st.completed),
          }))
        : [];
    }

    // RG-04 : Validité d'attribution de tâche
    if (assigneeId !== undefined) {
      if (assigneeId === null || assigneeId === '') {
        updateFields.assigneeId = null;
      } else {
        const validAssigneeId = toObjectId(assigneeId);
        if (validAssigneeId) {
          const assignee = await db.collection('users').findOne({
            _id: validAssigneeId,
            companyId: existingTask.companyId,
          });

          if (!assignee) {
            return NextResponse.json({
              error: 'Violation RG-04 : L\'utilisateur n\'appartient pas à la même entreprise.'
            }, { status: 400 });
          }

          // Vérifier si le projet a des membres
          const project = await db.collection('projects').findOne({
            _id: existingTask.projectId,
            companyId: existingTask.companyId,
          });

          if (project && project.memberIds && project.memberIds.length > 0) {
            const isMember = project.memberIds.some((m) => m.toString() === validAssigneeId.toString());
            if (!isMember) {
              return NextResponse.json({
                error: 'Violation RG-04 : L\'utilisateur doit faire partie des membres du projet.'
              }, { status: 400 });
            }
          }

          updateFields.assigneeId = validAssigneeId;
        }
      }
    }

    const result = await db.collection('tasks').findOneAndUpdate(
      filter,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur PUT /api/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const taskId = toObjectId(params.id);
    if (!taskId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');
    if (!companyIdParam) {
      return NextResponse.json({ error: 'companyId est obligatoire pour la suppression (RG-01)' }, { status: 400 });
    }

    const companyId = toObjectId(companyIdParam);
    if (!companyId) {
      return NextResponse.json({ error: 'companyId invalide' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const result = await db.collection('tasks').deleteOne({ _id: taskId, companyId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Tâche introuvable dans cette entreprise' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tâche supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur DELETE /api/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
