import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * Recherche avancée NoSQL :
 * Utilise l'index texte MongoDB ($text + $search + score de pertinence textScore)
 * avec filtrage strict par companyId (RG-01).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');
    const q = searchParams.get('q');

    if (!companyIdParam) {
      return NextResponse.json({ error: 'Le paramètre companyId est obligatoire' }, { status: 400 });
    }

    const companyId = toObjectId(companyIdParam);
    if (!companyId) {
      return NextResponse.json({ error: 'companyId invalide' }, { status: 400 });
    }

    if (!q || !q.trim()) {
      return NextResponse.json({ tasks: [], projects: [] });
    }

    const cleanQuery = q.trim();
    const { db } = await getDatabase();

    // 1. Recherche plein-texte sur les tâches
    let tasks = [];
    try {
      tasks = await db
        .collection('tasks')
        .find({
          companyId,
          $text: { $search: cleanQuery },
        }, {
          projection: { score: { $meta: 'textScore' } }
        })
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .toArray();
    } catch {
      // Fallback regex si l'index texte n'est pas encore indexé
      const regex = new RegExp(cleanQuery, 'i');
      tasks = await db
        .collection('tasks')
        .find({
          companyId,
          $or: [{ title: regex }, { description: regex }, { tags: regex }],
        })
        .limit(20)
        .toArray();
    }

    // 2. Recherche sur les projets
    const projectRegex = new RegExp(cleanQuery, 'i');
    const projects = await db
      .collection('projects')
      .find({
        companyId,
        $or: [{ name: projectRegex }, { description: projectRegex }],
      })
      .limit(10)
      .toArray();

    return NextResponse.json({
      query: cleanQuery,
      tasks,
      projects,
      totalResults: tasks.length + projects.length,
    });
  } catch (error) {
    console.error('Erreur GET /api/search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
