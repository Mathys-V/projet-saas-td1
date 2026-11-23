import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * Pipeline d'Agrégation Avancé MongoDB ($aggregate + $facet + $group)
 * Calcule tous les indicateurs clés de performance (KPIs) en une seule requête NoSQL
 * directement exécutée sur le moteur MongoDB côté serveur.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');

    if (!companyIdParam) {
      return NextResponse.json({ error: 'Le paramètre companyId est obligatoire' }, { status: 400 });
    }

    const companyId = toObjectId(companyIdParam);
    if (!companyId) {
      return NextResponse.json({ error: 'companyId invalide' }, { status: 400 });
    }

    const projectIdParam = searchParams.get('projectId');
    const projectFilter = projectIdParam && toObjectId(projectIdParam)
      ? { projectId: toObjectId(projectIdParam) }
      : {};

    const matchStage = {
      $match: {
        companyId,
        ...projectFilter,
      },
    };

    const nowISO = new Date().toISOString();

    const { db } = await getDatabase();

    // Pipeline d'agrégation MongoDB à facettes multiples
    const aggregateResult = await db.collection('tasks').aggregate([
      matchStage,
      {
        $facet: {
          // 1. Répartition par Statut Kanban
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],

          // 2. Répartition par Priorité
          priorityCounts: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
              },
            },
          ],

          // 3. Charge de travail par Membre (Assignee)
          workloadByAssignee: [
            {
              $group: {
                _id: '$assigneeId',
                total: { $sum: 1 },
                done: {
                  $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] },
                },
              },
            },
          ],

          // 4. Statistiques globales (Total, Complétées, En retard)
          globalOverview: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                completedTasks: {
                  $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] },
                },
                overdueTasks: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$dueDate', null] },
                          { $lt: ['$dueDate', nowISO] },
                          { $ne: ['$status', 'DONE'] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],

          // 5. Statistiques de sous-tâches (Checklists)
          subtasksOverview: [
            { $unwind: { path: '$subtasks', preserveNullAndEmptyArrays: false } },
            {
              $group: {
                _id: null,
                totalSubtasks: { $sum: 1 },
                completedSubtasks: {
                  $sum: { $cond: [{ $eq: ['$subtasks.completed', true] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]).toArray();

    const facetData = aggregateResult[0] || {};

    const overview = facetData.globalOverview?.[0] || {
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
    };

    const subtasks = facetData.subtasksOverview?.[0] || {
      totalSubtasks: 0,
      completedSubtasks: 0,
    };

    const completionRate = overview.totalTasks > 0
      ? Math.round((overview.completedTasks / overview.totalTasks) * 100)
      : 0;

    const subtaskRate = subtasks.totalSubtasks > 0
      ? Math.round((subtasks.completedSubtasks / subtasks.totalSubtasks) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      engine: 'MongoDB Aggregation Pipeline ($facet)',
      overview: {
        totalTasks: overview.totalTasks,
        completedTasks: overview.completedTasks,
        overdueTasks: overview.overdueTasks,
        completionRate,
      },
      subtasks: {
        totalSubtasks: subtasks.totalSubtasks,
        completedSubtasks: subtasks.completedSubtasks,
        subtaskRate,
      },
      statusBreakdown: facetData.statusCounts || [],
      priorityBreakdown: facetData.priorityCounts || [],
      workloadByAssignee: facetData.workloadByAssignee || [],
    });
  } catch (error) {
    console.error('Erreur GET /api/analytics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
