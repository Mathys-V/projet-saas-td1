'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/Context';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    activeCompany,
    companyUsers,
    companyProjects,
    activeProject,
    switchProject,
    loading: contextLoading,
  } = useApp();

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Charger toutes les tâches de l'entreprise active pour les KPIs globaux
  useEffect(() => {
    if (!activeCompany) return;
    async function loadAllCompanyTasks() {
      try {
        setLoadingTasks(true);
        const res = await fetch(`/api/tasks?companyId=${activeCompany._id}`);
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (err) {
        console.error('Erreur chargement tâches dashboard:', err);
      } finally {
        setLoadingTasks(false);
      }
    }
    loadAllCompanyTasks();
  }, [activeCompany]);

  // KPIs Entreprise
  const companyKPIs = useMemo(() => {
    const totalProjects = companyProjects.length;
    const activeProjects = companyProjects.filter((p) => p.status === 'ACTIVE').length;
    const totalCollaborators = companyUsers.length;
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    );

    return {
      totalProjects,
      activeProjects,
      totalCollaborators,
      totalTasks,
      doneTasks,
      completionRate,
      overdueTasks,
    };
  }, [companyProjects, companyUsers, tasks]);

  // KPIs Projet Actif
  const projectTasks = useMemo(() => {
    if (!activeProject) return [];
    return tasks.filter((t) => t.projectId === activeProject._id);
  }, [tasks, activeProject]);

  const projectKPIs = useMemo(() => {
    const total = projectTasks.length;
    const todo = projectTasks.filter((t) => t.status === 'TODO').length;
    const inProgress = projectTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const inReview = projectTasks.filter((t) => t.status === 'IN_REVIEW').length;
    const done = projectTasks.filter((t) => t.status === 'DONE').length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    const overdue = projectTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    );

    // Charge de travail par utilisateur
    const workload = {};
    companyUsers.forEach((u) => {
      workload[u._id] = { user: u, total: 0, done: 0 };
    });

    projectTasks.forEach((t) => {
      if (t.assigneeId && workload[t.assigneeId]) {
        workload[t.assigneeId].total += 1;
        if (t.status === 'DONE') workload[t.assigneeId].done += 1;
      }
    });

    const workloadList = Object.values(workload).filter((w) => w.total > 0);

    return {
      total,
      todo,
      inProgress,
      inReview,
      done,
      rate,
      overdue,
      workloadList,
    };
  }, [projectTasks, companyUsers]);

  if (contextLoading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        <div className="animate-pulse flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
          <span>Chargement du tableau de bord...</span>
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
          Créez une organisation ou connectez-vous pour accéder au tableau de bord.
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

  return (
    <div className="space-y-8">
      {/* Bannière Entreprise & Isolation Tenant */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeCompany.themeColor || '#4F46E5' }}
              />
              <span className="text-xs font-bold tracking-wider text-indigo-300 uppercase">
                Espace Entreprise • {activeCompany.industry || 'Multi-Tenant'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>RG-01 Cloisonné</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{activeCompany.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              {activeCompany.description ||
                'Plateforme SaaS de pilotage de projets et suivi opérationnel Kanban.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/kanban"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-2"
            >
              <span>Ouvrir le Kanban</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 1 : KPIs à l'échelle de l'entreprise */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Indicateurs Globaux de l&apos;Entreprise (Tenant)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Projets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Projets Actifs
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {companyKPIs.activeProjects}
              </span>
              <span className="text-[11px] text-slate-500">
                Sur {companyKPIs.totalProjects} projet(s) au total
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderKanban className="w-6 h-6" />
            </div>
          </div>

          {/* Collaborateurs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Collaborateurs
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {companyKPIs.totalCollaborators}
              </span>
              <span className="text-[11px] text-slate-500">Membres rattachés</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Total Tâches */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Tâches
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {companyKPIs.totalTasks}
              </span>
              <span className="text-[11px] text-slate-500">
                {companyKPIs.doneTasks} terminée(s)
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Taux d'avancement global */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Avancement Global
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {companyKPIs.completionRate}%
              </span>
              <span className="text-[11px] text-slate-500">Taux de résolution</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 : Suivi Détaillé à l'échelle d'un Projet */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
              Focus Projet
            </span>
            <h3 className="text-lg font-black text-slate-900">
              {activeProject ? activeProject.name : 'Aucun projet sélectionné'}
            </h3>
            {activeProject?.description && (
              <p className="text-xs text-slate-500 mt-0.5">{activeProject.description}</p>
            )}
          </div>

          {/* Sélecteur de projet */}
          <div className="flex items-center space-x-3">
            <select
              value={activeProject?._id || ''}
              onChange={(e) => switchProject(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {companyProjects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <Link
              href="/kanban"
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center space-x-1"
            >
              <span>Voir Kanban</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {activeProject ? (
          <div className="space-y-6">
            {/* Barre de progression du projet */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-700">Taux de complétion du projet</span>
                <span className="font-extrabold text-indigo-600 text-sm">
                  {projectKPIs.rate}% ({projectKPIs.done}/{projectKPIs.total} tâches)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projectKPIs.rate}%` }}
                />
              </div>
            </div>

            {/* Répartition des tâches par statut */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  À faire
                </span>
                <span className="text-xl font-black text-slate-800 mt-1 block">
                  {projectKPIs.todo}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  En cours
                </span>
                <span className="text-xl font-black text-blue-700 mt-1 block">
                  {projectKPIs.inProgress}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                  En revue
                </span>
                <span className="text-xl font-black text-amber-700 mt-1 block">
                  {projectKPIs.inReview}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Terminé
                </span>
                <span className="text-xl font-black text-emerald-700 mt-1 block">
                  {projectKPIs.done}
                </span>
              </div>
            </div>

            {/* Alertes Tâches en retard et Charge de travail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Alerte Tâches en retard */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-700 mb-3">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Tâches en retard ({projectKPIs.overdue.length})</span>
                </div>

                {projectKPIs.overdue.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    🎉 Aucune tâche en retard sur ce projet !
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {projectKPIs.overdue.map((t) => (
                      <div
                        key={t._id}
                        className="p-2.5 rounded-xl bg-white border border-rose-200 flex items-center justify-between text-xs"
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-slate-800 block truncate">
                            {t.title}
                          </span>
                          <span className="text-[10px] text-rose-600 flex items-center space-x-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>
                              Échéance : {new Date(t.dueDate).toLocaleDateString('fr-FR')}
                            </span>
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Répartition de la charge de travail par collaborateur */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Charge de travail par membre</span>
                </div>

                {projectKPIs.workloadList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Aucune tâche attribuée pour le moment.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {projectKPIs.workloadList.map(({ user, total, done }) => {
                      const userRate = Math.round((done / total) * 100);
                      return (
                        <div key={user._id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                style={{ backgroundColor: user.avatarColor || '#4F46E5' }}
                              >
                                {user.fullName?.charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-800">
                                {user.fullName}
                              </span>
                            </div>
                            <span className="text-slate-500 text-[11px]">
                              <strong className="text-slate-800">{done}</strong> / {total} terminée(s)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${userRate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            Aucun projet disponible dans cette entreprise.
          </div>
        )}
      </div>
    </div>
  );
}
