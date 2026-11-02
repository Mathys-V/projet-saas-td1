import { NextResponse } from 'next/server';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';
import { hashPassword } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await ensureSeedData();
    const body = await request.json();
    const { mode, companyName, industry, description, themeColor, fullName, email, password, jobTitle, companyId, role } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Nom complet et e-mail sont obligatoires' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const cleanEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();
    const hashedPassword = hashPassword(password || 'password123');

    if (mode === 'new_company') {
      if (!companyName) {
        return NextResponse.json({ error: 'Le nom de l\'entreprise est obligatoire' }, { status: 400 });
      }

      // 1. Créer l'entreprise
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newCompanyId = new ObjectId();
      const newCompany = {
        _id: newCompanyId,
        name: companyName.trim(),
        slug,
        industry: industry || 'Général',
        description: description || `Espace SaaS pour ${companyName}`,
        themeColor: themeColor || '#4F46E5',
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('companies').insertOne(newCompany);

      // 2. Créer l'utilisateur Administrateur rattaché
      const newUserId = new ObjectId();
      const newUser = {
        _id: newUserId,
        companyId: newCompanyId,
        fullName: fullName.trim(),
        email: cleanEmail,
        role: 'ADMIN',
        jobTitle: jobTitle || 'Fondateur & Dirigeant',
        avatarColor: themeColor || '#4F46E5',
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('users').insertOne(newUser);

      // 3. Optionnel : Créer un projet par défaut pour l'entreprise
      const defaultProjectId = new ObjectId();
      await db.collection('projects').insertOne({
        _id: defaultProjectId,
        companyId: newCompanyId,
        name: 'Mon Premier Projet',
        description: 'Projet d\'accueil généré automatiquement lors de l\'inscription.',
        status: 'ACTIVE',
        memberIds: [newUserId],
        startDate: now,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      });

      // Tâche d'exemple
      await db.collection('tasks').insertOne({
        _id: new ObjectId(),
        companyId: newCompanyId,
        projectId: defaultProjectId,
        assigneeId: newUserId,
        title: 'Découvrir la plateforme et inviter vos collaborateurs',
        description: 'Bienvenue sur votre espace SaaS dédié ! Vous pouvez modifier vos tâches et inviter d\'autres membres.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        order: 1,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['Bienvenue', 'Onboarding'],
        subtasks: [
          { _id: 'sub_welcome_1', title: 'Explorer le tableau Kanban', completed: false },
          { _id: 'sub_welcome_2', title: 'Créer un nouveau projet', completed: false }
        ],
        comments: [],
        createdAt: now,
        updatedAt: now,
      });

      const { password: _, ...safeUser } = newUser;
      return NextResponse.json({
        success: true,
        user: safeUser,
        company: newCompany,
        message: 'Entreprise et compte administrateur créés avec succès'
      }, { status: 201 });

    } else if (mode === 'join_company') {
      if (!companyId) {
        return NextResponse.json({ error: 'L\'identifiant de l\'entreprise est obligatoire' }, { status: 400 });
      }

      const targetCompanyId = toObjectId(companyId);
      const company = await db.collection('companies').findOne({ _id: targetCompanyId });
      if (!company) {
        return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
      }

      // Vérifier si l'utilisateur existe déjà dans cette entreprise
      const existing = await db.collection('users').findOne({ companyId: targetCompanyId, email: cleanEmail });
      if (existing) {
        return NextResponse.json({ error: 'Un collaborateur avec cet e-mail existe déjà dans cette entreprise' }, { status: 409 });
      }

      const newUserId = new ObjectId();
      const newUser = {
        _id: newUserId,
        companyId: targetCompanyId,
        fullName: fullName.trim(),
        email: cleanEmail,
        role: role || 'MEMBER',
        jobTitle: jobTitle || 'Collaborateur',
        avatarColor: '#10B981',
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('users').insertOne(newUser);

      const { password: _, ...safeUser } = newUser;
      return NextResponse.json({
        success: true,
        user: safeUser,
        company,
        message: 'Compte collaborateur créé avec succès'
      }, { status: 201 });

    } else {
      return NextResponse.json({ error: 'Mode d\'inscription invalide (new_company ou join_company)' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur API register:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
