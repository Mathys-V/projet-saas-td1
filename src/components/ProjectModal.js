'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, FolderKanban } from 'lucide-react';

export default function ProjectModal({
  isOpen,
  project,
  onClose,
  onSave,
  companyUsers = [],
  companyId,
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    memberIds: [],
    targetDate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'ACTIVE',
        memberIds: Array.isArray(project.memberIds) ? project.memberIds.map(String) : [],
        targetDate: project.targetDate ? project.targetDate.split('T')[0] : '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'ACTIVE',
        memberIds: [],
        targetDate: '',
      });
    }
  }, [project]);

  if (!isOpen) return null;

  const isEditing = Boolean(project && project._id);

  const handleToggleMember = (userId) => {
    const strId = String(userId);
    setFormData((prev) => {
      const exists = prev.memberIds.includes(strId);
      return {
        ...prev,
        memberIds: exists ? prev.memberIds.filter((id) => id !== strId) : [...prev.memberIds, strId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Le nom du projet est obligatoire');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...formData,
        companyId,
        targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : null,
      });
      onClose();
    } catch (err) {
      alert('Erreur enregistrement projet : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Modifier le projet' : 'Créer un nouveau projet'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Nom du projet *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Refonte Dashboard Client v2"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Objectifs et périmètre du projet..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ACTIVE">Actif</option>
                <option value="COMPLETED">Terminé</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Date cible
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Assignation des membres (RG-03) */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5" />
                <span>Membres de l&apos;équipe (RG-03 : même entreprise)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {formData.memberIds.length} sélectionné(s)
              </span>
            </label>

            <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
              {companyUsers.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-2">Aucun utilisateur disponible</p>
              ) : (
                companyUsers.map((u) => {
                  const isChecked = formData.memberIds.includes(String(u._id));
                  return (
                    <label
                      key={u._id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-50/80 border border-indigo-200' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMember(u._id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: u.avatarColor || '#4F46E5' }}
                        >
                          {u.fullName?.charAt(0)}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-800 block">
                            {u.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{u.jobTitle}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {u.role}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
