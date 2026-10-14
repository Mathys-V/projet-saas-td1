import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

let seedChecked = false;

export async function ensureSeedData() {
  if (seedChecked) return;

  const { db } = await getDatabase();
  const companyCount = await db.collection('companies').countDocuments();

  if (companyCount > 0) {
    seedChecked = true;
    return;
  }

  console.log('🌱 Base de données vide détectée : insertion des données de démonstration...');

  const now = new Date().toISOString();

  // ==========================================
  // ENTREPRISE 1 : TechNova Solutions
  // ==========================================
  const company1Id = new ObjectId('665f1a000000000000000001');
  const user1A = new ObjectId('665f1b000000000000000010');
  const user1B = new ObjectId('665f1b000000000000000011');
  const user1C = new ObjectId('665f1b000000000000000012');
  const project1A = new ObjectId('665f1c000000000000000100');
  const project1B = new ObjectId('665f1c000000000000000101');

  // ==========================================
  // ENTREPRISE 2 : GreenLogistique (Isolation)
  // ==========================================
  const company2Id = new ObjectId('665f1a000000000000000002');
  const user2A = new ObjectId('665f1b000000000000000020');
  const user2B = new ObjectId('665f1b000000000000000021');
  const project2A = new ObjectId('665f1c000000000000000200');

  const companies = [
    {
      _id: company1Id,
      name: 'TechNova Solutions',
      slug: 'technova-solutions',
      industry: 'Édition de logiciels Cloud',
      description: 'Startup spécialisée dans les outils de productivité B2B et architectures distribuées.',
      themeColor: '#4F46E5',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: company2Id,
      name: 'GreenLogistique',
      slug: 'green-logistique',
      industry: 'Transport & Supply Chain décarbonée',
      description: 'Gestion de flotte électrique et optimisation des tournées de livraison urbaine.',
      themeColor: '#059669',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const users = [
    // Membres TechNova
    {
      _id: user1A,
      companyId: company1Id,
      fullName: 'Alice Martin',
      email: 'alice.martin@technova.io',
      role: 'ADMIN',
      jobTitle: 'CTO & Lead Architect',
      avatarColor: '#4F46E5',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: user1B,
      companyId: company1Id,
      fullName: 'Lucas Bernard',
      email: 'lucas.bernard@technova.io',
      role: 'MANAGER',
      jobTitle: 'Product Manager',
      avatarColor: '#0EA5E9',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: user1C,
      companyId: company1Id,
      fullName: 'Chloé Dubois',
      email: 'chloe.dubois@technova.io',
      role: 'MEMBER',
      jobTitle: 'Full-Stack Developer',
      avatarColor: '#EC4899',
      createdAt: now,
      updatedAt: now,
    },
    // Membres GreenLogistique
    {
      _id: user2A,
      companyId: company2Id,
      fullName: 'Marc Lefèvre',
      email: 'marc.lefevre@greenlog.fr',
      role: 'ADMIN',
      jobTitle: 'Directeur des Opérations',
      avatarColor: '#059669',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: user2B,
      companyId: company2Id,
      fullName: 'Sarah Koné',
      email: 'sarah.kone@greenlog.fr',
      role: 'MEMBER',
      jobTitle: 'Ingénieure IoT & Flotte',
      avatarColor: '#D97706',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const projects = [
    {
      _id: project1A,
      companyId: company1Id,
      name: 'Refonte Portail Client SaaS v2',
      description: 'Migration de l’interface Kanban et mise en place du cloisonnement multi-tenant.',
      status: 'ACTIVE',
      memberIds: [user1A, user1B, user1C],
      startDate: '2026-10-01T00:00:00.000Z',
      targetDate: '2026-12-15T00:00:00.000Z',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: project1B,
      companyId: company1Id,
      name: 'Cluster MongoDB Sharding (Partie II)',
      description: 'Préparation de l’architecture distribuée avec Replica Set et routeurs mongos.',
      status: 'ACTIVE',
      memberIds: [user1A, user1C],
      startDate: '2026-10-10T00:00:00.000Z',
      targetDate: '2026-11-30T00:00:00.000Z',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: project2A,
      companyId: company2Id,
      name: 'Déploiement Bornes de Recharge Hub Nord',
      description: 'Installation et supervision temps réel de 40 bornes rapides pour utilitaires.',
      status: 'ACTIVE',
      memberIds: [user2A, user2B],
      startDate: '2026-09-15T00:00:00.000Z',
      targetDate: '2026-11-20T00:00:00.000Z',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const tasks = [
    // Tâches TechNova - Projet 1A
    {
      _id: new ObjectId('665f1d000000000000001000'),
      companyId: company1Id,
      projectId: project1A,
      assigneeId: user1A,
      title: 'Implémenter l’isolation multi-tenant sur l’API',
      description: 'Garantir que chaque requête filtre strictement les documents par companyId.',
      status: 'DONE',
      priority: 'CRITICAL',
      order: 1,
      dueDate: '2026-10-20T18:00:00.000Z',
      tags: ['Backend', 'Sécurité', 'MongoDB'],
      subtasks: [
        { _id: 'sub_1', title: 'Créer la validation companyId sur toutes les routes', completed: true },
        { _id: 'sub_2', title: 'Vérifier les suppressions en cascade', completed: true },
      ],
      comments: [
        {
          _id: 'com_1',
          authorId: user1A,
          authorName: 'Alice Martin',
          content: 'Le cloisonnement est actif et testé sur les 4 collections.',
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId('665f1d000000000000001001'),
      companyId: company1Id,
      projectId: project1A,
      assigneeId: user1C,
      title: 'Développer le tableau Kanban avec Drag & Drop',
      description: 'Permettre de glisser-déposer les cartes entre À faire, En cours, En revue et Terminé.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      order: 2,
      dueDate: '2026-10-28T18:00:00.000Z',
      tags: ['Frontend', 'UX', 'Kanban'],
      subtasks: [
        { _id: 'sub_3', title: 'Créer les 4 colonnes de statut', completed: true },
        { _id: 'sub_4', title: 'Gérer les événements onDragStart et onDrop', completed: true },
        { _id: 'sub_5', title: 'Ajouter la modale de détails avec sous-tâches', completed: false },
      ],
      comments: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId('665f1d000000000000001002'),
      companyId: company1Id,
      projectId: project1A,
      assigneeId: user1B,
      title: 'Rédiger les spécifications fonctionnelles et techniques',
      description: 'Documenter le modèle JSON et la stratégie de Shard Key pour le livrable PDF.',
      status: 'IN_REVIEW',
      priority: 'MEDIUM',
      order: 3,
      dueDate: '2026-10-22T18:00:00.000Z',
      tags: ['Documentation', 'Architecture'],
      subtasks: [
        { _id: 'sub_6', title: 'Exporter la spécification fonctionnelle en PDF', completed: true },
        { _id: 'sub_7', title: 'Exporter la spécification technique en PDF', completed: true },
      ],
      comments: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId('665f1d000000000000001003'),
      companyId: company1Id,
      projectId: project1A,
      assigneeId: user1C,
      title: 'Ajouter les filtres rapides par membre et priorité',
      description: 'Barre de recherche instantanée au-dessus du Kanban.',
      status: 'TODO',
      priority: 'LOW',
      order: 4,
      dueDate: '2026-11-05T18:00:00.000Z',
      tags: ['Frontend', 'Filtres'],
      subtasks: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    },
    // Tâche TechNova - Projet 1B
    {
      _id: new ObjectId('665f1d000000000000001004'),
      companyId: company1Id,
      projectId: project1B,
      assigneeId: user1A,
      title: 'Externaliser la configuration dans config/database.config.json',
      description: 'Permettre de changer l’URI MongoDB sans modifier le code source.',
      status: 'DONE',
      priority: 'CRITICAL',
      order: 1,
      dueDate: '2026-10-18T18:00:00.000Z',
      tags: ['Docker', 'Sharding', 'Config'],
      subtasks: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    },
    // Tâches GreenLogistique - Projet 2A (Totalement isolées de TechNova)
    {
      _id: new ObjectId('665f1d000000000000002000'),
      companyId: company2Id,
      projectId: project2A,
      assigneeId: user2A,
      title: 'Valider le raccordement électrique haute puissance',
      description: 'Contrôle de conformité avec Enedis sur l’entrepôt Nord.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      order: 1,
      dueDate: '2026-10-30T18:00:00.000Z',
      tags: ['Infrastructure', 'Énergie'],
      subtasks: [
        { _id: 'sub_20', title: 'Audit du transformateur principal', completed: true },
        { _id: 'sub_21', title: 'Signature du procès-verbal de réception', completed: false },
      ],
      comments: [
        {
          _id: 'com_20',
          authorId: user2A,
          authorName: 'Marc Lefèvre',
          content: 'Rendez-vous technique confirmé pour mardi matin.',
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId('665f1d000000000000002001'),
      companyId: company2Id,
      projectId: project2A,
      assigneeId: user2B,
      title: 'Connecter la télémétrie OCPP des bornes au dashboard',
      description: 'Remontée de l’état de charge des camions électriques toutes les 30 secondes.',
      status: 'TODO',
      priority: 'HIGH',
      order: 2,
      dueDate: '2026-11-12T18:00:00.000Z',
      tags: ['IoT', 'Backend'],
      subtasks: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.collection('companies').insertMany(companies);
  await db.collection('users').insertMany(users);
  await db.collection('projects').insertMany(projects);
  await db.collection('tasks').insertMany(tasks);

  seedChecked = true;
  console.log('✅ Données de démonstration insérées avec succès !');
}