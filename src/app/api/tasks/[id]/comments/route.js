import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const taskId = toObjectId(params.id);
    if (!taskId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { authorId, authorName, content, companyId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Le contenu du commentaire ne peut pas être vide' }, { status: 400 });
    }

    const filter = { _id: taskId };
    if (companyId) {
      const validCompanyId = toObjectId(companyId);
      if (validCompanyId) filter.companyId = validCompanyId;
    }

    const newComment = {
      _id: `com_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      authorId: authorId ? toObjectId(authorId) : null,
      authorName: authorName || 'Utilisateur',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const { db } = await getDatabase();
    const result = await db.collection('tasks').findOneAndUpdate(
      filter,
      {
        $push: { comments: newComment },
        $set: { updatedAt: new Date().toISOString() }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Tâche introuvable ou accès refusé' }, { status: 404 });
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tasks/[id]/comments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
