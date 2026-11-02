import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const userId = toObjectId(params.id);
    if (!userId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');
    const filter = { _id: userId };
    if (companyIdParam) {
      const companyId = toObjectId(companyIdParam);
      if (companyId) filter.companyId = companyId;
    }

    const { db } = await getDatabase();
    const user = await db.collection('users').findOne(filter, { projection: { password: 0 } });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur GET /api/users/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const userId = toObjectId(params.id);
    if (!userId) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { fullName, email, role, jobTitle, avatarColor, password, companyId } = body;

    const filter = { _id: userId };
    if (companyId) {
      const validCompanyId = toObjectId(companyId);
      if (validCompanyId) filter.companyId = validCompanyId;
    }

    const updateFields = {
      updatedAt: new Date().toISOString(),
    };

    if (fullName !== undefined) updateFields.fullName = fullName.trim();
    if (role !== undefined) updateFields.role = role;
    if (jobTitle !== undefined) updateFields.jobTitle = jobTitle.trim();
    if (avatarColor !== undefined) updateFields.avatarColor = avatarColor;
    if (password) updateFields.password = hashPassword(password);
    if (email !== undefined) updateFields.email = email.trim().toLowerCase();

    const { db } = await getDatabase();
    const result = await db.collection('users').findOneAndUpdate(
      filter,
      { $set: updateFields },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
      return NextResponse.json({ error: 'Utilisateur introuvable ou accès refusé' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur PUT /api/users/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = toObjectId(params.id);
    if (!userId) {
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

    // 1. Désassigner l'utilisateur des projets de l'entreprise ($pull)
    await db.collection('projects').updateMany(
      { companyId, memberIds: userId },
      { $pull: { memberIds: userId }, $set: { updatedAt: new Date().toISOString() } }
    );

    // 2. Désassigner l'utilisateur des tâches de l'entreprise (assigneeId -> null) (RG-06)
    await db.collection('tasks').updateMany(
      { companyId, assigneeId: userId },
      { $set: { assigneeId: null, updatedAt: new Date().toISOString() } }
    );

    // 3. Supprimer l'utilisateur
    const delResult = await db.collection('users').deleteOne({ _id: userId, companyId });

    if (delResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Utilisateur introuvable dans cette entreprise' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé et tâches désattribuées avec succès.'
    });
  } catch (error) {
    console.error('Erreur DELETE /api/users/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
