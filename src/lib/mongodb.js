import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

let cachedClient = null;
let cachedDb = null;
let indexesCreated = false;

function loadDatabaseConfig() {
  const configPath = process.env.DB_CONFIG_PATH || path.join(process.cwd(), 'config', 'database.config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Fichier de configuration introuvable : ${configPath}`);
  }

  const rawContent = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(rawContent);

  if (!parsed.database || !parsed.database.uri) {
    throw new Error('Le fichier config/database.config.json doit contenir "database.uri"');
  }

  return parsed.database;
}

async function ensureIndexes(db) {
  if (indexesCreated) return;
  try {
    await Promise.all([
      db.collection('users').createIndex({ companyId: 1, email: 1 }, { unique: true }),
      db.collection('projects').createIndex({ companyId: 1, createdAt: -1 }),
      db.collection('tasks').createIndex({ companyId: 1, projectId: 1, status: 1 }),
      db.collection('tasks').createIndex({ companyId: 1, assigneeId: 1 })
    ]);
    indexesCreated = true;
  } catch (error) {
    console.warn('Avertissement lors de la création des index :', error.message);
  }
}

export async function getDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const dbConfig = loadDatabaseConfig();
  const client = new MongoClient(dbConfig.uri, dbConfig.options || {});

  await client.connect();
  const db = client.db(dbConfig.dbName || 'saas_project_db');

  cachedClient = client;
  cachedDb = db;

  await ensureIndexes(db);

  return { client, db };
}

export function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  return null;
}