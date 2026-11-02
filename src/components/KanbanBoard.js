'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';
import {
  Search,
  Plus,
  User,
  SlidersHorizontal,
  X,
  AlertCircle,
} from 'lucide-react';

const COLUMNS = [
  { id: 'TODO', title: 'À faire', dotColor: 'bg-slate-400' },
  { id: 'IN_PROGRESS', title: 'En cours', dotColor: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'En revue', dotColor: 'bg-amber-500' },
  { id: 'DONE', title: 'Terminé', dotColor: 'bg-emerald-500' },
];

function matchesSearch(task, query) {
  if (!query) return true;
  const inTitle = task.title?.toLowerCase().includes(query);
  const inDesc = task.description?.toLowerCase().includes(query);
  return inTitle || inDesc;
}

function matchesAssignee(task, selectedAssignee, onlyMyTasks, activeUserId) {
  if (onlyMyTasks && activeUserId) {
    if (!task.assigneeId || task.assigneeId.toString() !== activeUserId.toString()) {
      return false;
    }
  }

  if (selectedAssignee === 'unassigned') {
    return !task.assigneeId;
  } else if (selectedAssignee) {
    return task.assigneeId?.toString() === selectedAssignee;
  }
  return true;
}

export default function KanbanBoard({
  companyId,
  projectId,
  users = [],
  activeUser,
  projectName = 'Projet',
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Modale de tâche
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTaskForModal, setActiveTaskForModal] = useState(null);

  // Map des utilisateurs pour affichage rapide
  const usersMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u._id] = u;
    });
    return map;
  }, [users]);

  // Récupération des tâches du projet
  const fetchTasks = useCallback(async () => {
    if (!companyId || !projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/tasks?companyId=${companyId}&projectId=${projectId}`);
      if (!res.ok) throw new Error('Impossible de charger les tâches');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, projectId]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  // Tous les tags disponibles dans les tâches
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    tasks.forEach((t) => {
      (t.tags || []).forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [tasks]);

  // Filtrage dynamique côté client
  const filteredTasks = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    const activeUserId = activeUser?._id;

    return tasks.filter((task) => {
      if (!matchesSearch(task, cleanQuery)) return false;
      if (!matchesAssignee(task, selectedAssignee, onlyMyTasks, activeUserId)) return false;
      if (selectedPriority && task.priority !== selectedPriority) return false;
      if (selectedTag && !(task.tags || []).includes(selectedTag)) return false;
      return true;
    });
  }, [tasks, searchQuery, onlyMyTasks, activeUser, selectedAssignee, selectedPriority, selectedTag]);

  // Drag & Drop
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task._id);
  };

  const handleDropTask = async (taskId, newStatus) => {
    const currentTask = tasks.find((t) => t._id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    // Mise à jour optimiste immédiate de l'UI
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        void fetchTasks();
      }
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      void fetchTasks();
    }
  };

  // Actions modale
  const handleOpenCreateModal = (defaultStatus = 'TODO') => {
    setActiveTaskForModal({ status: defaultStatus });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setActiveTaskForModal(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskPayload) => {
    if (activeTaskForModal?._id) {
      const res = await fetch(`/api/tasks/${activeTaskForModal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur mise à jour tâche');
      }
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } else {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur création tâche');
      }
      const created = await res.json();
      setTasks((prev) => [...prev, created]);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}?companyId=${companyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      }
    } catch (err) {
      alert('Erreur suppression : ' + err.message);
    }
  };

  const handleAddComment = (taskId, comment) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t))
    );
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAssignee('');
    setSelectedPriority('');
    setSelectedTag('');
    setOnlyMyTasks(false);
  };

  const hasActiveFilters =
    Boolean(searchQuery || selectedAssignee || selectedPriority || selectedTag || onlyMyTasks);

  let kanbanContent;
  if (loading) {
    kanbanContent = (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        <div className="animate-pulse flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
          <span>Chargement du tableau Kanban...</span>
        </div>
      </div>
    );
  } else if (error) {
    kanbanContent = (
      <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-sm flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  } else {
    kanbanContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={filteredTasks.filter((t) => t.status === col.id)}
            usersMap={usersMap}
            onTaskClick={handleOpenEditModal}
            onDragStart={handleDragStart}
            onDropTask={handleDropTask}
            onAddTaskClick={handleOpenCreateModal}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre d'outils et de filtres dynamiques */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Recherche textuelle */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre ou mot-clé..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Boutons d'action rapides */}
          <div className="flex items-center space-x-2">
            {/* Bouton Mes tâches */}
            {activeUser && (
              <button
                onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  onlyMyTasks
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Mes tâches</span>
              </button>
            )}

            {/* Bouton Nouvelle tâche */}
            <button
              onClick={() => handleOpenCreateModal('TODO')}
              className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle tâche</span>
            </button>
          </div>
        </div>

        {/* Filtres secondaires */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1 text-slate-400 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">Filtres:</span>
          </div>

          {/* Filtre Assigné */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tous les membres</option>
            <option value="unassigned">Non attribué</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.fullName}
              </option>
            ))}
          </select>

          {/* Filtre Priorité */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Toutes les priorités</option>
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>

          {/* Filtre Tag */}
          {availableTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tous les tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}

          {/* Réinitialiser les filtres */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-indigo-600 hover:text-indigo-800 font-medium text-xs px-2 py-1 rounded hover:bg-indigo-50 flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          )}

          <div className="ml-auto text-slate-400 text-xs">
            Affichage de <span className="font-semibold text-slate-700">{filteredTasks.length}</span> sur {tasks.length} tâche(s)
          </div>
        </div>
      </div>

      {kanbanContent}

      {/* Modale d'enrichissement et d'édition de tâche */}
      <TaskModal
        isOpen={isModalOpen}
        task={activeTaskForModal}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onAddComment={handleAddComment}
        users={users}
        companyId={companyId}
        projectId={projectId}
        activeUser={activeUser}
      />
    </div>
  );
}
