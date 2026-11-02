'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/Context';
import UserModal from '@/components/UserModal';
import {
  UserPlus,
  Mail,
  Edit2,
  Trash2,
  Building2,
  UserCheck,
} from 'lucide-react';

export default function UsersPage() {
  const {
    activeCompany,
    companyUsers,
    companyProjects,
    refreshCompanyData,
    activeUser,
    switchUser,
    loading,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setSelectedUser(u);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userPayload) => {
    if (selectedUser?._id) {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur modification collaborateur');
      }
    } else {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur création collaborateur');
      }
    }
    await refreshCompanyData();
  };

  const handleDeleteUser = async (userId) => {
    if (
      !confirm(
        '⚠️ Êtes-vous sûr de vouloir retirer ce collaborateur de l\'entreprise ? Il sera automatiquement désassigné des projets et ses tâches passeront à « Non attribué » (RG-06).'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}?companyId=${activeCompany._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur suppression collaborateur');
      }
      await refreshCompanyData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'ADMIN', style: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'MANAGER':
        return { label: 'CHEF DE PROJET', style: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'MEMBER':
      default:
        return { label: 'MEMBRE', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        <div className="animate-pulse flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
          <span>Chargement des collaborateurs...</span>
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
            Annuaire d&apos;Entreprise • {activeCompany.name}
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Collaborateurs & Rôles</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion des membres de l&apos;organisation et attribution des rôles (RG-02 / RG-05)
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un collaborateur</span>
        </button>
      </div>

      {/* Grille des utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companyUsers.map((u) => {
          const roleBadge = getRoleBadge(u.role);
          const isCurrentUser = activeUser?._id === u._id;

          const assignedProjectsCount = companyProjects.filter((p) =>
            (p.memberIds || []).some(
              (mId) => (typeof mId === 'object' ? mId.toString() : mId) === u._id
            )
          ).length;

          return (
            <div
              key={u._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                isCurrentUser ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  {/* Avatar & Nom */}
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-sm shrink-0"
                      style={{ backgroundColor: u.avatarColor || '#4F46E5' }}
                    >
                      {u.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className="text-sm font-bold text-slate-900">{u.fullName}</h3>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                            Vous
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block">{u.jobTitle || 'Collaborateur'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      title="Modifier le collaborateur"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                      title="Supprimer le collaborateur (désassignation auto)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center space-x-2 text-xs text-slate-500 mb-3">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>

                {/* Badge Rôle & Statut */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.style}`}
                  >
                    {roleBadge.label}
                  </span>

                  <span className="text-[11px] text-slate-500">
                    <strong className="text-slate-800">{assignedProjectsCount}</strong> projet(s) assigné(s)
                  </span>
                </div>
              </div>

              {/* Bouton pour basculer en tant que cet utilisateur (Évaluation & Tests) */}
              <button
                onClick={() => switchUser(u._id)}
                disabled={isCurrentUser}
                className={`mt-4 w-full py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center space-x-1.5 ${
                  isCurrentUser
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                    : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>
                  {isCurrentUser ? 'Utilisateur Actif' : 'Basculer sur ce compte'}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Utilisateur */}
      <UserModal
        isOpen={isModalOpen}
        user={selectedUser}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        companyId={activeCompany._id}
      />
    </div>
  );
}
