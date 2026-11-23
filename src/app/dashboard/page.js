'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/Context';
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building2,
  Database,
  History,
  Download,
  Activity,
  Layers,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const {
    activeCompany,
    companyUsers,
    companyProjects,
    activeProject,
    switchProject,
    isDemoMode,
    isAuthenticated,
    loading: contextLoading,
  } = useApp();

  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirection automatique vers /login si non connecté et hors mode démo
  useEffect(() => {
    if (!contextLoading && !isAuthenticated && !isDemoMode) {
      router.replace('/login');
    }
  }, [contextLoading, isAuthenticated, isDemoMode, router]);

  // Charger les données (tâches, agrégations MongoDB et logs d'activité)
  useEffect(() => {
    if (!activeCompany) return;

    let isMounted = true;
    async function fetchDashboardData() {
      try {
        setLoadingData(true);
        const [tasksRes, analyticsRes, logsRes] = await Promise.all([
          fetch(`/api/tasks?companyId=${activeCompany._id}`),
          fetch(`/api/analytics?companyId=${activeCompany._id}`),
          fetch(`/api/activity-logs?companyId=${activeCompany._id}&limit=10`),
        ]);

        if (isMounted) {
          if (tasksRes.ok) setTasks(await tasksRes.json());
          if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
          if (logsRes.ok) setActivityLogs(await logsRes.json());
        }
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    void fetchDashboardData();
    return () => {
      isMounted = false;
    };
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
          Connectez-vous avec vos identifiants ou passez en mode démo pour accéder à la plateforme.
        </p>
        <div className="flex items-center justify-center space-x-3">
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            <span>Se connecter</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
          >
            <span>Créer une entreprise</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bannière Entreprise & Isolation Tenant */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
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
              {isDemoMode && (
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Mode Démo Actif</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{activeCompany.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              {activeCompany.description ||
                'Plateforme SaaS de pilotage de projets et suivi opérationnel Kanban.'}
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            {/* Export JSON */}
            <a
              href={`/api/export?companyId=${activeCompany._id}&format=json`}
              download
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center space-x-1.5"
              title="Exporter les données du tenant au format JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </a>

            {/* Export CSV */}
            <a
              href={`/api/export?companyId=${activeCompany._id}&format=csv`}
              download
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center space-x-1.5"
              title="Exporter les tâches au format CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            <Link
              href="/kanban"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-2"
            >
              <span>Ouvrir le Kanban</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION BONUS 1 : Pipeline d'Agrégation Avancé MongoDB ($facet, $group, $unwind) */}
      {analytics && (
        <div className="bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-blue-50/60 border border-indigo-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Moteur d&apos;Agrégation MongoDB NoSQL ($aggregate + $facet)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Feature Bonus BDD
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Calculé côté serveur MongoDB en 1 seule requête NoSQL sans boucle côté application.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono text-indigo-700 bg-white/80 px-2.5 py-1 rounded-lg border border-indigo-200">
              Pipeline: $match ➔ $facet ($group, $unwind, $cond)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Tâches totales</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">
                {analytics.overview?.totalTasks || 0}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {analytics.overview?.completionRate || 0}% complétées
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Checklists (Sous-tâches)</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">
                {analytics.subtasks?.completedSubtasks || 0} / {analytics.subtasks?.totalSubtasks || 0}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">
                {analytics.subtasks?.subtaskRate || 0}% terminées ($unwind)
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Tâches en retard</span>
              <span className="text-xl font-black text-rose-600 mt-0.5 block">
                {analytics.overview?.overdueTasks || 0}
              </span>
              <span className="text-[10px] text-slate-400">
                Filtre temporel NoSQL
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Répartition statuts</span>
              <div className="flex items-center space-x-1.5 mt-1">
                {(analytics.statusBreakdown || []).map((s) => (
                  <span
                    key={s._id}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                    title={`${s._id}: ${s.count}`}
                  >
                    {s._id?.slice(0, 4)}: {s.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2 : Indicateurs Globaux Entreprise */}
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
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {companyKPIs.completionRate}%
              </span>
              <span className="text-[11px] text-slate-500">
                {companyKPIs.overdueTasks.length > 0 ? (
                  <span className="text-rose-600 font-semibold">
                    {companyKPIs.overdueTasks.length} en retard
                  </span>
                ) : (
                  'Aucun retard détecté'
                )}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 : Suivi Spécifique du Projet Actif */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
              Zoom Opérationnel
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Suivi Détaillé par Projet
            </h2>
          </div>

          {/* Sélecteur de projet */}
          {companyProjects.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Projet :</span>
              <select
                value={activeProject?._id || ''}
                onChange={(e) => switchProject(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {companyProjects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeProject ? (
          <div className="space-y-6">
            {/* Barre de progression globale du projet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Progression des tâches</span>
                <span className="font-extrabold text-indigo-600">{projectKPIs.rate}% terminé</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projectKPIs.rate}%` }}
                />
              </div>
            </div>

            {/* Découpage par statut Kanban */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  À faire
                </span>
                <span className="text-xl font-black text-slate-800 mt-1 block">
                  {projectKPIs.todo}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                  En cours
                </span>
                <span className="text-xl font-black text-amber-800 mt-1 block">
                  {projectKPIs.inProgress}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
                  En revue
                </span>
                <span className="text-xl font-black text-blue-800 mt-1 block">
                  {projectKPIs.inReview}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
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

      {/* SECTION BONUS 2 : Journal d'Audit & Historique Récent (TTL Index MongoDB) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Journal d&apos;Audit & Historique d&apos;Activité
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Index TTL 30j
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Traçabilité NoSQL complète des actions par entreprise (collection <code>activity_logs</code>).
              </p>
            </div>
          </div>

          <span className="text-[11px] text-slate-400">
            Dernières actions enregistrées
          </span>
        </div>

        {activityLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            Aucune action récente enregistrée dans l&apos;audit trail.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
            {activityLogs.map((log) => (
              <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 truncate mr-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="font-bold text-slate-800">{log.userName}</span>
                  <span className="text-slate-600 truncate">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
