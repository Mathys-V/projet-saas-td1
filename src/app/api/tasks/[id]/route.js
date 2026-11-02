import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
const VALID_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

async function verifyTaskAssignee(db, companyId, projectId, assigneeId) {
  if (assigneeId === null || assigneeId === '') {
    return { valid: true, value: null };
  }
  const validAssigneeId = toObjectId(assigneeId);
  if (!validAssigneeId) return { valid: true, value: undefined };

  const assignee = await db.collection('users').findOne({ _id: validAssigneeId, companyId });
  if (!assignee) {
    return { valid: false, error: 'Violation RG-04 : L\'utilisateur n\'appartient pas à la même entreprise.' };
  }

  const project = await db.collection('projects').findOne({ _id: projectId, companyId });
  if (project?.memberIds?.length > 0) {
    const isMember = project.memberIds.some((m) => m.toString() === validAssigneeId.toString());
    if (!isMember) {
      return { valid: false, error: 'Violation RG-04 : L\'utilisateur doit faire partie des membres du projet.' };
    }
  }

  return { valid: true, value: validAssigneeId };
}

function buildTaskUpdateFields(body) {
  const fields = { updatedAt: new Date().toISOString() };
  if (body.title !== undefined) fields.title = body.title.trim();
  if (body.description !== undefined) fields.description = body.description.trim();
  if (body.status !== undefined && VALID_STATUSES.has(body.status)) fields.status = body.status;
  if (body.priority !== undefined && VALID_PRIORITIES.has(body.priority)) fields.priority = body.priority;
  if (body.order !== undefined) fields.order = Number(body.order);
  if (body.dueDate !== undefined) fields.dueDate = body.dueDate;
  if (body.tags !== undefined) {
    fields.tags = Array.isArray(body.tags) ? body.tags.map((t) => String(t).trim()).filter(Boolean) : [];
  }
  if (body.subtasks !== undefined) {
    fields.subtasks = Array.isArray(body.subtasks)
      ? body.subtasks.map((st, i) => ({
          _id: st._id || `sub_${Date.now()}_${i}`,
          title: st.title || '',
          completed: Boolean(st.completed),
        }))
      : [];
  }
  return fields;
}

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
    const filter = { _id: taskId };
    if (body.companyId) {
      const validCompanyId = toObjectId(body.companyId);
      if (validCompanyId) filter.companyId = validCompanyId;
    }

    const { db } = await getDatabase();
    const existingTask = await db.collection('tasks').findOne(filter);
    if (!existingTask) {
      return NextResponse.json({ error: 'Tâche introuvable ou accès refusé' }, { status: 404 });
    }

    if (body.status !== undefined && !VALID_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }
    if (body.priority !== undefined && !VALID_PRIORITIES.has(body.priority)) {
      return NextResponse.json({ error: 'Priorité invalide' }, { status: 400 });
    }

    const updateFields = buildTaskUpdateFields(body);

    if (body.assigneeId !== undefined) {
      const assigneeCheck = await verifyTaskAssignee(
        db,
        existingTask.companyId,
        existingTask.projectId,
        body.assigneeId
      );
      if (!assigneeCheck.valid) {
        return NextResponse.json({ error: assigneeCheck.error }, { status: 400 });
      }
      if (assigneeCheck.value !== undefined) {
        updateFields.assigneeId = assigneeCheck.value;
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

    return NextResponse.json({ success: true, message: 'Tâche supprimée avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /api/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
