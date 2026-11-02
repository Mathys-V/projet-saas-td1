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

## 🔐 Inscription & Connexion SaaS

L'application propose deux méthodes d'authentification pour satisfaire à la fois les exigences de production et la fluidité d'évaluation :

1. **Page de Connexion (`/login`)** :
   - Saisie e-mail & mot de passe (sécurisé via PBKDF2).
   - **Boutons Démonstration en 1 Clic** : Connectez-vous instantanément en tant qu'Alice Martin (CTO TechNova), Lucas Bernard (Chef de projet) ou Marc Lefèvre (Admin GreenLogistique) sans saisir d'identifiants.
2. **Page d'Inscription (`/register`)** :
   - **Créer une nouvelle entreprise (Tenant)** : Provisionne instantanément une nouvelle organisation cliente isolée, son administrateur, ainsi qu'un premier projet d'accueil.
   - **Rejoindre une entreprise** : Crée un compte collaborateur au sein d'une organisation existante.
3. **Sélecteur Rapide de Contexte (Navbar)** :
   - Situé dans la barre supérieure, il permet à l'évaluateur de basculer en un clic d'entreprise active et d'utilisateur actif sans déconnexion fastidieuse.

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
