# MultiTask SaaS - Application de Gestion de Projet Multi-Entreprises (TD1 - Partie I)

Application SaaS moderne inspirée des standards du marché (Trello, Notion, ClickUp) intégrant une modélisation documentaire MongoDB, une architecture d'isolation logicielle stricte (**Multi-Tenancy**), et une orchestration complète sous Docker Compose.

---

## 🚀 Démarrage Rapide en Une Seule Commande

Conformément aux exigences du TD, **aucune installation locale de dépendances (Node.js, npm, MongoDB) n'est requise**. L'intégralité du système est conteneurisée et se lance via :

```bash
docker compose up -d --build
```

L'application web est immédiatement accessible sur : **[http://localhost:3000](http://localhost:3000)**  
L'instance MongoDB 7.0 est accessible sur le port hôte **`27017`**.

Pour arrêter les conteneurs :
```bash
docker compose down
```

---

## 🔐 Mode Normal vs Mode Test & Démonstration

L'application intègre une séparation nette entre l'utilisation normale en production et l'environnement d'évaluation :

1. **Mode Normal (Standard)** :
   - À l'ouverture du site, tout utilisateur non connecté arrive sur la page `/login`.
   - L'utilisateur peut se connecter avec ses identifiants ou créer sa propre organisation SaaS via `/register`.
   - **Isolation visuelle stricte** : un utilisateur connecté ne voit que sa propre entreprise dans l'interface (aucun menu déroulant pour basculer sur les organisations concurrentes).
2. **Mode Test & Démonstration (Évaluation rapide)** :
   - Accessible en 1 clic depuis la page de connexion via le bouton **« Mode Démo (Accès Rapide) »**.
   - Pré-charge instantanément les données de test (TechNova Solutions & GreenLogistique).
   - Affiche un bandeau d'évaluation jaune et active le sélecteur rapide inter-entreprises dans la Navbar pour permettre au correcteur de vérifier instantanément le cloisonnement multi-tenant (RG-01).
   - Inclut un bouton **Reset Seed (↺)** pour réinitialiser la base à son état d'origine à tout moment.

---

## 🌟 Fonctionnalités Bonus Spéciales MongoDB & SaaS

En complément des fonctionnalités socles, plusieurs fonctionnalités à forte valeur ajoutée ont été implémentées :

1. **Pipeline d'Agrégation Avancé MongoDB (`$facet`, `$group`, `$unwind`, `$cond`)** :
   - Route API dédiée : `/api/analytics?companyId=...`
   - Calcule l'intégralité des métriques, de la vélocité des sous-tâches et de la répartition par collaborateur en **une seule requête NoSQL complexe** exécutée directement sur le moteur MongoDB côté serveur.
2. **Journal d'Audit & Historique NoSQL (`activity_logs`) avec Index TTL** :
   - Traçabilité complète des actions (créations de tâches, déplacements Kanban, modifications de projet).
   - Utilisation d'un **Index TTL MongoDB (`expireAfterSeconds: 30 jours`)** pour purge automatique sans script cron.
   - Route API : `/api/activity-logs?companyId=...` et widget en direct sur le Dashboard.
3. **Recherche Plein-Texte NoSQL via Index Texte MongoDB (`$text`, `$search`)** :
   - Création d'index texte composés sur `tasks` et `projects`.
   - Recherche pondérée avec calcul du score de pertinence (`textScore`).
   - Route API : `/api/search?companyId=...&q=...`.
4. **Export Complet des Données du Tenant (JSON & CSV)** :
   - Téléchargement en 1 clic de l'intégralité des données de l'entreprise cliente au format JSON structuré ou CSV (tâches).
   - Prouve l'étanchéité absolue de l'exportation (zéro fuite de données inter-entreprises).
   - Route API : `/api/export?companyId=...&format=json|csv`.
5. **Vue Calendrier / Échéances (Timeline)** :
   - Sélecteur de vue sur le Kanban : bascule instantanée entre **Vue Colonnes Kanban** et **Vue Chronologique / Échéances** (En retard, Cette semaine, Plus tard, Sans date).

---

## 🏢 Comptes & Données de Démonstration (Seed Automatique)

Au premier lancement, la base est automatiquement initialisée avec **2 entreprises totalement cloisonnées** :

| Entreprise | Collaborateur | E-mail | Rôle | Mot de passe démo |
| :--- | :--- | :--- | :--- | :--- |
| **TechNova Solutions** (Cloud SaaS) | Alice Martin | `alice.martin@technova.io` | **ADMIN** | `password123` |
| **TechNova Solutions** | Lucas Bernard | `lucas.bernard@technova.io` | **MANAGER** | `password123` |
| **TechNova Solutions** | Chloé Dubois | `chloe.dubois@technova.io` | **MEMBER** | `password123` |
| **GreenLogistique** (Transport Décarboné) | Marc Lefèvre | `marc.lefevre@greenlog.fr` | **ADMIN** | `password123` |
| **GreenLogistique** | Sarah Koné | `sarah.kone@greenlog.fr` | **MEMBER** | `password123` |

> 💡 **Bouton Réinitialiser (↺)** : Un bouton dédié dans la barre de navigation permet de réinitialiser instantanément les collections aux données initiales de test à tout moment via `/api/seed`.

---

## ✨ Fonctionnalités Majeures

### 1. Tableau Kanban Interactif (Drag & Drop)
- **Déplacement fluide** des cartes entre les 4 colonnes de statut : *À faire*, *En cours*, *En revue*, *Terminé*.
- **Mise à jour en temps réel** de la base de données MongoDB lors du glisser-déposer.
- **Barre d'outils dynamique** :
  - Recherche instantanée par mot-clé (titre / description).
  - Filtre rapide **« Mes tâches »** ciblant le collaborateur actif.
  - Filtre par priorité (*Basse*, *Moyenne*, *Haute*, *Critique*).
  - Filtre par étiquette / tag (*#Backend*, *#Frontend*, *#Sécurité*...).

### 2. Modale de Tâche Enrichie
- **Sous-tâches (Checklist)** avec calcul automatique de la barre de progression (ex : *3/5 complétées - 60%*).
- **Date d'échéance (Deadline)** avec indicateur visuel clignotant **« En retard »** si la date est dépassée.
- **Gestion des étiquettes (Tags)** personnalisables.
- **Fil de discussion / commentaires** horodaté avec nom de l'auteur et avatar.

### 3. Tableau de Bord Analytique (Dashboard KPIs)
- **KPIs Entreprise** : Nombre de projets actifs, nombre de collaborateurs, total des tâches et taux global de complétion.
- **KPIs Projet** : Progression en pourcentage, répartition graphique par statut, alerte sur les tâches en retard, et charge de travail par collaborateur.

### 4. Gestion Complète des Entités (CRUD)
- **Entreprises** : Création, modification et **suppression en cascade** (supprime automatiquement tous les utilisateurs, projets et tâches rattachés conformément à RG-06).
- **Utilisateurs** : Gestion de l'annuaire et des rôles (**ADMIN**, **MANAGER**, **MEMBER**). La suppression d'un utilisateur désassigne automatiquement ses projets ($pull) et remet ses tâches à « Non attribué ».
- **Projets** : Création, modification des membres d'équipe (RG-03), et suppression en cascade de ses tâches.

---

## 🛡️ Règles de Gestion Métier (RG) Respectées

- **RG-01 (Isolation Multi-Tenant)** : Toute requête MongoDB côté serveur filtre obligatoirement sur `{ companyId: ObjectId(...) }`.
- **RG-02 (Unicité d'appartenance)** : Un utilisateur et un projet sont strictement rattachés à une seule entreprise.
- **RG-03 (Validité d'assignation)** : Impossible d'assigner un utilisateur à un projet s'il n'appartient pas à la même entreprise.
- **RG-04 (Attribution de tâche)** : Une tâche ne peut être confiée qu'à un membre faisant partie de l'entreprise et de l'équipe projet.
- **RG-05 (Cycle de vie)** : Tout statut de tâche est validé parmi `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`.
- **RG-06 (Suppressions en cascade séquentielle)** : Adaptée au mode Standalone MongoDB sans transactions multi-documents, garantissant la cohérence des données.

---

## ⚙️ Préparation à la Partie II (Réplication & Sharding)

Conformément aux consignes, **aucun paramètre de connexion n'est codé en dur**. Le fichier externe `config/database.config.json` est monté en volume dans le conteneur Docker.

### Configuration Actuelle (Partie I - Standalone) :
```json
{
  "database": {
    "uri": "mongodb://mongodb:27017",
    "dbName": "saas_project_db",
    "options": {
      "maxPoolSize": 20,
      "serverSelectionTimeoutMS": 5000,
      "retryWrites": false
    }
  }
}
```

### Évolution vers la Partie II (sans modifier une seule ligne de code) :
- **Pour un Replica Set** : Modifier l'URI vers `mongodb://mongo1:27017,mongo2:27017/?replicaSet=rs0` et basculer `"retryWrites": true`.
- **Pour un Cluster Shardé** : Remplacer l'URI par celle des routeurs `mongos`. Le modèle de données a déjà dénormalisé `companyId` dans toutes les collections, fournissant la Shard Key parfaite `{ companyId: 1 }`.
