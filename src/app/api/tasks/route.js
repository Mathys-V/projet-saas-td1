import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

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

    const filter = { companyId };

    const projectIdParam = searchParams.get('projectId');
    if (projectIdParam) {
      const projectId = toObjectId(projectIdParam);
      if (projectId) filter.projectId = projectId;
    }

    const assigneeIdParam = searchParams.get('assigneeId');
    if (assigneeIdParam) {
      if (assigneeIdParam === 'unassigned') {
        filter.assigneeId = null;
      } else {
        const assigneeId = toObjectId(assigneeIdParam);
        if (assigneeId) filter.assigneeId = assigneeId;
      }
    }

    const statusParam = searchParams.get('status');
    if (statusParam && VALID_STATUSES.includes(statusParam)) {
      filter.status = statusParam;
    }

    const priorityParam = searchParams.get('priority');
    if (priorityParam && VALID_PRIORITIES.includes(priorityParam)) {
      filter.priority = priorityParam;
    }

    const tagParam = searchParams.get('tag');
    if (tagParam) {
      filter.tags = tagParam;
    }

    const searchParam = searchParams.get('search');
    if (searchParam && searchParam.trim()) {
      const regex = new RegExp(searchParam.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

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
    const {
      companyId,
      projectId,
      assigneeId,
      title,
      description,
      status,
      priority,
      order,
      dueDate,
      tags,
      subtasks,
    } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Le companyId est obligatoire (RG-01)' }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: 'Le projectId est obligatoire' }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Le titre de la tâche est obligatoire' }, { status: 400 });
    }

    const validCompanyId = toObjectId(companyId);
    const validProjectId = toObjectId(projectId);
    if (!validCompanyId || !validProjectId) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 400 });
    }

    const { db } = await getDatabase();

    // Vérifier que le projet appartient bien à l'entreprise
    const project = await db.collection('projects').findOne({
      _id: validProjectId,
      companyId: validCompanyId,
    });
    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable dans cette entreprise' }, { status: 404 });
    }

    // RG-04 : Validité d'attribution de tâche
    let validAssigneeId = null;
    if (assigneeId) {
      validAssigneeId = toObjectId(assigneeId);
      if (validAssigneeId) {
        const assignee = await db.collection('users').findOne({
          _id: validAssigneeId,
          companyId: validCompanyId,
        });

        if (!assignee) {
          return NextResponse.json({
            error: 'Violation RG-04 : Une tâche ne peut être attribuée qu\'à un utilisateur de la même entreprise.'
          }, { status: 400 });
        }

        // Si le projet a des membres définis, vérifier que l'assignee en fait partie
        if (project.memberIds && project.memberIds.length > 0) {
          const isMember = project.memberIds.some((m) => m.toString() === validAssigneeId.toString());
          if (!isMember) {
            return NextResponse.json({
              error: 'Violation RG-04 : L\'utilisateur doit être assigné comme membre au projet.'
            }, { status: 400 });
          }
        }
      }
    }

    // RG-05 : Cycle de vie d'une tâche (Statut obligatoire valide)
    const taskStatus = VALID_STATUSES.includes(status) ? status : 'TODO';
    const taskPriority = VALID_PRIORITIES.includes(priority) ? priority : 'MEDIUM';

    // Formater les sous-tâches (subtasks)
    const formattedSubtasks = Array.isArray(subtasks)
      ? subtasks.map((st, index) => ({
          _id: st._id || `sub_${Date.now()}_${index}`,
          title: st.title || '',
          completed: Boolean(st.completed),
        }))
      : [];

    const now = new Date().toISOString();
    const newTask = {
      _id: new ObjectId(),
      companyId: validCompanyId,
      projectId: validProjectId,
      assigneeId: validAssigneeId,
      title: title.trim(),
      description: description ? description.trim() : '',
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
