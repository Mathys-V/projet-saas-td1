'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/Context';
import CompanyModal from '@/components/CompanyModal';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function CompaniesPage() {
  const {
    companies,
    activeCompany,
    switchCompany,
    reloadCompanies,
    loading,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const handleOpenCreateModal = () => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setSelectedCompany(c);
    setIsModalOpen(true);
  };

  const handleSaveCompany = async (companyPayload) => {
    if (selectedCompany?._id) {
      const res = await fetch(`/api/companies/${selectedCompany._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyPayload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur mise à jour entreprise');
      }
    } else {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyPayload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur création entreprise');
      }
    }
    await reloadCompanies();
  };

  const handleDeleteCompany = async (companyId) => {
    if (
      !confirm(
        '🚨 ATTENTION SUPPRESSION EN CASCADE (RG-06) :\n\nSupprimer cette entreprise supprimera DÉFINITIVEMENT :\n- Tous ses collaborateurs\n- Tous ses projets\n- Toutes ses tâches Kanban\n\nConfirmez-vous cette opération irréversible ?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur suppression entreprise');
      }
      const result = await res.json();
      alert(
        `Entreprise supprimée avec succès !\nDétails cascade : ${result.details?.usersDeleted} utilisateurs, ${result.details?.projectsDeleted} projets, ${result.details?.tasksDeleted} tâches supprimés.`
      );
      await reloadCompanies();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        <div className="animate-pulse flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
          <span>Chargement des entreprises...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Architecture Multi-Tenant (Partie I & II)
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestion des Entreprises (Tenants)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cloisonnement strict des données et administration des organisations clientes
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle entreprise</span>
        </button>
      </div>

      {/* Grille des entreprises */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((c) => {
          const isActive = activeCompany?._id === c._id;
          return (
            <div
              key={c._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                isActive ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: c.themeColor || '#4F46E5' }}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">{c.name}</h3>
                      <span className="text-xs text-slate-500 block">{c.industry || 'Général'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(c)}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      title="Modifier l'entreprise"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(c._id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                      title="Supprimer l'entreprise (Suppression en cascade RG-06)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-3 mb-4 min-h-[48px]">
                  {c.description || 'Aucune description disponible.'}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[10px] font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    ID: {c._id.slice(-6)}...
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Espace Actif</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bouton de bascule de Tenant */}
              <button
                onClick={() => switchCompany(c._id)}
                disabled={isActive}
                className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center space-x-1.5 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 cursor-default'
                    : 'bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 border-slate-200'
                }`}
              >
                <span>{isActive ? 'Organisation Active' : 'Basculer sur cet Espace'}</span>
                {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Entreprise */}
      <CompanyModal
        isOpen={isModalOpen}
        company={selectedCompany}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCompany}
      />
    </div>
  );
}
