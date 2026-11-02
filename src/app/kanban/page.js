'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/Context';
import KanbanBoard from '@/components/KanbanBoard';
import ProjectModal from '@/components/ProjectModal';
import {
  FolderKanban,
  Plus,
  Calendar,
  Users,
  Settings,
  ShieldCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';

export default function KanbanPage() {
  const {
    activeCompany,
    companyUsers,
    companyProjects,
    activeProject,
    switchProject,
    activeUser,
    refreshCompanyData,
    loading,
  } = useApp();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const handleSaveProject = async (projectPayload) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectPayload),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur création projet');
    }
    await refreshCompanyData();
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        <div className="animate-pulse flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
          <span>Chargement de l&apos;espace de travail Kanban...</span>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Aucune entreprise active</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Veuillez sélectionner ou créer une entreprise pour afficher le tableau Kanban.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          <span>Créer une entreprise</span>
        </Link>
      </div>
    );
  }

  // Filtrer les utilisateurs assignés au projet actif
  const projectMembers = (activeProject?.memberIds || [])
    .map((mId) => companyUsers.find((u) => u._id === (typeof mId === 'object' ? mId.toString() : mId)))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* En-tête du Tableau Kanban */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-700">{activeCompany.name}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Projets & Kanban</span>
            </div>

            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeProject ? activeProject.name : 'Sélectionnez un projet'}
              </h1>

              {activeProject?.status && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {activeProject.status}
                </span>
              )}
            </div>

            {activeProject?.description && (
              <p className="text-xs text-slate-500 max-w-2xl">{activeProject.description}</p>
            )}
          </div>

          {/* Sélecteur de projet et actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Onglets / Liste des projets */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
                Projet:
              </label>
              <select
                value={activeProject?._id || ''}
                onChange={(e) => switchProject(e.target.value)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {companyProjects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Membres assignés au projet */}
            <div className="flex items-center -space-x-1.5 overflow-hidden pl-1" title="Équipe du projet">
              {projectMembers.map((m) => (
                <div
                  key={m._id}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: m.avatarColor || '#4F46E5' }}
                  title={`${m.fullName} (${m.role})`}
                >
                  {m.fullName?.charAt(0)}
                </div>
              ))}
            </div>

            {/* Bouton Nouveau Projet */}
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau projet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tableau Kanban Interactif */}
      {activeProject ? (
        <KanbanBoard
          companyId={activeCompany._id}
          projectId={activeProject._id}
          projectName={activeProject.name}
          users={companyUsers}
          activeUser={activeUser}
        />
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Aucun projet créé dans cette entreprise</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Créez votre premier projet pour commencer à organiser vos tâches sur le tableau Kanban.
          </p>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
          >
            + Créer un premier projet
          </button>
        </div>
      )}

      {/* Modale de création de projet */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        companyUsers={companyUsers}
        companyId={activeCompany._id}
      />
    </div>
  );
}
