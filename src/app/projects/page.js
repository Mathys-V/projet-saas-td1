'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/Context';
import ProjectModal from '@/components/ProjectModal';
import {
  FolderKanban,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  Building2,
} from 'lucide-react';

function getProjectStatusBadgeClass(status) {
  if (status === 'COMPLETED') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (status === 'ARCHIVED') {
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }
  return 'bg-indigo-50 text-indigo-700 border-indigo-200';
}

export default function ProjectsPage() {
  const {
    activeCompany,
    companyUsers,
    companyProjects,
    refreshCompanyData,
    switchProject,
    loading,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasksMap, setTasksMap] = useState({});

  // Charger les stats de tâches pour chaque projet
  useEffect(() => {
    if (!activeCompany) return;
    async function loadTasks() {
      try {
        const res = await fetch(`/api/tasks?companyId=${activeCompany._id}`);
        if (res.ok) {
          const tasks = await res.json();
          const map = {};
          tasks.forEach((t) => {
            const pId = typeof t.projectId === 'object' ? t.projectId.toString() : t.projectId;
            if (!map[pId]) map[pId] = { total: 0, done: 0 };
            map[pId].total += 1;
            if (t.status === 'DONE') map[pId].done += 1;
          });
          setTasksMap(map);
        }
      } catch (err) {
        console.error('Erreur chargement tâches:', err);
      }
    }
    void loadTasks();
  }, [activeCompany, companyProjects]);

  const handleOpenCreateModal = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj) => {
    setSelectedProject(proj);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (projectPayload) => {
    if (selectedProject?._id) {
      const res = await fetch(`/api/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectPayload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur mise à jour projet');
      }
    } else {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectPayload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur création projet');
      }
    }
    await refreshCompanyData();
  };

  const handleDeleteProject = async (projectId) => {
    if (
      !confirm(
        '⚠️ Êtes-vous sûr de vouloir supprimer ce projet ? Toutes ses tâches associées seront DÉFINITIVEMENT supprimées (Suppression en cascade RG-06) !'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}?companyId=${activeCompany._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur suppression projet');
      }
      await refreshCompanyData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        <div className="animate-pulse flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
          <span>Chargement des projets...</span>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Aucune entreprise active</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Gestion des Projets • {activeCompany.name}
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Projets de l&apos;Entreprise</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administration des projets et assignation des collaborateurs (RG-03)
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau projet</span>
        </button>
      </div>

      {/* Grille des projets */}
      {companyProjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Aucun projet trouvé</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Créez un projet pour débuter la planification de vos tâches.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
          >
            + Créer un premier projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companyProjects.map((proj) => {
            const stats = tasksMap[proj._id] || { total: 0, done: 0 };
            const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
            const statusBadgeClass = getProjectStatusBadgeClass(proj.status);

            const members = (proj.memberIds || [])
              .map((mId) => companyUsers.find((u) => u._id === (typeof mId === 'object' ? mId.toString() : mId)))
              .filter(Boolean);

            return (
              <div
                key={proj._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                      {proj.status || 'ACTIVE'}
                    </span>

                    {/* Actions Modifier / Supprimer */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(proj)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title="Modifier le projet"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj._id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="Supprimer le projet (cascade)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">
                    {proj.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-normal min-h-[32px]">
                    {proj.description || 'Aucune description spécifiée.'}
                  </p>

                  {/* Barre de progression */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium text-slate-500">Avancement</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {stats.done}/{stats.total} tâches ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Date cible et membres */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <div className="flex items-center space-x-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {proj.targetDate
                          ? new Date(proj.targetDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Aucune date'}
                      </span>
                    </div>

                    <div className="flex items-center -space-x-1 overflow-hidden" title="Membres assignés">
                      {members.slice(0, 3).map((m) => (
                        <div
                          key={m._id}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white"
                          style={{ backgroundColor: m.avatarColor || '#4F46E5' }}
                        >
                          {m.fullName?.charAt(0)}
                        </div>
                      ))}
                      {members.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400 pl-1">
                          +{members.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bouton vers Kanban */}
                <Link
                  href="/kanban"
                  onClick={() => switchProject(proj._id)}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Ouvrir dans le Kanban</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Projet */}
      <ProjectModal
        isOpen={isModalOpen}
        project={selectedProject}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        companyUsers={companyUsers}
        companyId={activeCompany._id}
      />
    </div>
  );
}
