import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ensureSeedData } from '@/lib/seed';
import { verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await ensureSeedData();
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Adresse e-mail requise' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const user = await db.collection('users').findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé avec cet e-mail' }, { status: 404 });
    }

    // Si un mot de passe est fourni, on le vérifie
    if (password && user.password) {
      const isValid = verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
      }
    }

    // Récupérer l'entreprise associée
    const company = await db.collection('companies').findOne({ _id: user.companyId });

    // Nettoyer les données sensibles (mot de passe)
    const safeUser = { ...user };
    delete safeUser.password;

    return NextResponse.json({
      success: true,
      user: safeUser,
      company: company || null,
      message: 'Connexion réussie'
    });
  } catch (error) {
    console.error('Erreur API login:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
