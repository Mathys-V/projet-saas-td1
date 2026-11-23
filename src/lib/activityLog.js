import { ObjectId } from 'mongodb';
import { getDatabase, toObjectId } from './mongodb';

/**
 * Enregistre une action d'activité dans la collection MongoDB activity_logs
 * avec isolation stricte par companyId et index TTL.
 */
export async function logActivity({ companyId, userId, userName, action, entityType, entityId, details }) {
  try {
    const validCompanyId = toObjectId(companyId);
    if (!validCompanyId) return;

    const { db } = await getDatabase();
    const logDoc = {
      _id: new ObjectId(),
      companyId: validCompanyId,
      userId: toObjectId(userId) || null,
      userName: userName || 'Système',
      action: action || 'UPDATE',
      entityType: entityType || 'GENERAL',
      entityId: toObjectId(entityId) || (entityId ? String(entityId) : null),
      details: details || '',
      createdAt: new Date().toISOString(),
    };

    await db.collection('activity_logs').insertOne(logDoc);
  } catch (error) {
    console.warn('Erreur lors de l\'enregistrement du log d\'activité:', error.message);
  }
}
