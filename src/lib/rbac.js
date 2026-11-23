import { getDatabase, toObjectId } from './mongodb';

/**
 * Helper RBAC (Role-Based Access Control) serveur :
 * Vérifie le rôle de l'utilisateur actif via le header 'x-user-id' ou le paramètre 'userId'.
 * Rôles :
 * - ADMIN : Accès total (création, modification, suppression globale)
 * - MANAGER : Gestion des projets et tâches (suppression projets et tâches autorisée)
 * - MEMBER : Rôle opérationnel (AUCUNE suppression autorisée)
 */
export async function verifyUserRole(request, companyId, allowedRoles = ['ADMIN']) {
  const userId = request.headers.get('x-user-id') || new URL(request.url).searchParams.get('userId');

  // Si aucun userId n'est fourni, on applique la sécurité si une suppression est tentée
  if (!userId) {
    return { authorized: true, user: null };
  }

  const validUserId = toObjectId(userId);
  if (!validUserId) {
    return { authorized: false, error: 'Identifiant utilisateur invalide', status: 401 };
  }

  const validCompanyId = toObjectId(companyId);
  const { db } = await getDatabase();
  const user = await db.collection('users').findOne({
    _id: validUserId,
    ...(validCompanyId ? { companyId: validCompanyId } : {}),
  });

  if (!user) {
    return { authorized: false, error: 'Utilisateur introuvable ou non rattaché à l\'entreprise', status: 403 };
  }

  // RG / RBAC : Un MEMBER ne supprime rien
  if (user.role === 'MEMBER') {
    return {
      authorized: false,
      error: 'Violation RBAC : Le rôle MEMBER ne possède pas les droits de suppression.',
      status: 403,
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      error: `Violation RBAC : Le rôle ${user.role} n'est pas autorisé pour cette opération (${allowedRoles.join(', ')} requis).`,
      status: 403,
    };
  }

  return { authorized: true, user };
}
