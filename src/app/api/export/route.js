import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');
    const format = searchParams.get('format') || 'json';

    if (!companyIdParam) {
      return NextResponse.json({ error: 'companyId obligatoire' }, { status: 400 });
    }

    const companyId = toObjectId(companyIdParam);
    if (!companyId) {
      return NextResponse.json({ error: 'companyId invalide' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const [company, users, projects, tasks] = await Promise.all([
      db.collection('companies').findOne({ _id: companyId }),
      db.collection('users').find({ companyId }, { projection: { password: 0 } }).toArray(),
      db.collection('projects').find({ companyId }).toArray(),
      db.collection('tasks').find({ companyId }).toArray(),
    ]);

    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    if (format === 'csv') {
      // Export CSV des tâches
      const headers = ['ID', 'Titre', 'Statut', 'Priorité', 'Date_Echeance', 'Tags', 'Sous_Taches_Total', 'Sous_Taches_Faites'];
      const rows = tasks.map((t) => [
        `"${t._id}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${t.status}"`,
        `"${t.priority}"`,
        `"${t.dueDate || ''}"`,
        `"${(t.tags || []).join(';')}"`,
        t.subtasks?.length || 0,
        t.subtasks?.filter((s) => s.completed)?.length || 0,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="export_${company.slug}_tasks.csv"`,
        },
      });
    }

    // Export JSON complet
    const exportData = {
      exportDate: new Date().toISOString(),
      tenant: company,
      statistics: {
        totalUsers: users.length,
        totalProjects: projects.length,
        totalTasks: tasks.length,
      },
      users,
      projects,
      tasks,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="export_${company.slug}_full.json"`,
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/export:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
