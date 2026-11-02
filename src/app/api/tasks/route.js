import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
const VALID_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

function buildTaskFilter(searchParams, companyId) {
  const filter = { companyId };

  const projectId = searchParams.get('projectId');
  if (projectId && toObjectId(projectId)) {
    filter.projectId = toObjectId(projectId);
  }

  const assigneeId = searchParams.get('assigneeId');
  if (assigneeId === 'unassigned') {
    filter.assigneeId = null;
  } else if (assigneeId && toObjectId(assigneeId)) {
    filter.assigneeId = toObjectId(assigneeId);
  }

  const status = searchParams.get('status');
  if (status && VALID_STATUSES.has(status)) {
    filter.status = status;
  }

  const priority = searchParams.get('priority');
  if (priority && VALID_PRIORITIES.has(priority)) {
    filter.priority = priority;
  }

  const tag = searchParams.get('tag');
  if (tag) filter.tags = tag;

  const search = searchParams.get('search');
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  return filter;
}

async function validateTaskAssignee(db, companyId, project, assigneeId) {
  if (!assigneeId) return { valid: true, validAssigneeId: null };
  const validId = toObjectId(assigneeId);
  if (!validId) return { valid: true, validAssigneeId: null };

  const assignee = await db.collection('users').findOne({ _id: validId, companyId });
  if (!assignee) {
    return { valid: false, error: 'Violation RG-04 : L\'utilisateur n\'appartient pas à la même entreprise.' };
  }

  if (project.memberIds?.length > 0) {
    const isMember = project.memberIds.some((m) => m.toString() === validId.toString());
    if (!isMember) {
      return { valid: false, error: 'Violation RG-04 : L\'utilisateur doit être assigné comme membre au projet.' };
    }
  }

  return { valid: true, validAssigneeId: validId };
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

    const filter = buildTaskFilter(searchParams, companyId);
    const { db } = await getDatabase();
    const tasks = await db.collection('tasks')
      .find(filter)
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Erreur GET /api/tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureSeedData();
    const body = await request.json();
    const { companyId, projectId, assigneeId, title, description, status, priority, order, dueDate, tags, subtasks } = body;

    if (!companyId || !projectId) {
      return NextResponse.json({ error: 'companyId et projectId sont obligatoires' }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Le titre de la tâche est obligatoire' }, { status: 400 });
    }

    const validCompanyId = toObjectId(companyId);
    const validProjectId = toObjectId(projectId);
    if (!validCompanyId || !validProjectId) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const project = await db.collection('projects').findOne({ _id: validProjectId, companyId: validCompanyId });
    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable dans cette entreprise' }, { status: 404 });
    }

    const assigneeCheck = await validateTaskAssignee(db, validCompanyId, project, assigneeId);
    if (!assigneeCheck.valid) {
      return NextResponse.json({ error: assigneeCheck.error }, { status: 400 });
    }

    const taskStatus = VALID_STATUSES.has(status) ? status : 'TODO';
    const taskPriority = VALID_PRIORITIES.has(priority) ? priority : 'MEDIUM';

    const formattedSubtasks = Array.isArray(subtasks)
      ? subtasks.map((st, idx) => ({
          _id: st._id || `sub_${Date.now()}_${idx}`,
          title: st.title || '',
          completed: Boolean(st.completed),
        }))
      : [];

    const now = new Date().toISOString();
    const newTask = {
      _id: new ObjectId(),
      companyId: validCompanyId,
      projectId: validProjectId,
      assigneeId: assigneeCheck.validAssigneeId,
      title: title.trim(),
      description: description?.trim() || '',
      status: taskStatus,
      priority: taskPriority,
      order: typeof order === 'number' ? order : 1,
      dueDate: dueDate || null,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      subtasks: formattedSubtasks,
      comments: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('tasks').insertOne(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
