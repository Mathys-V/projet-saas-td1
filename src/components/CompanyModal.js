'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';

const THEME_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#2563EB', // Blue
  '#7C3AED', // Violet
  '#D97706', // Amber
  '#DC2626', // Red
  '#0891B2', // Cyan
  '#475569', // Slate
];

export default function CompanyModal({
  isOpen,
  company,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    themeColor: '#4F46E5',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        description: company.description || '',
        themeColor: company.themeColor || '#4F46E5',
      });
    } else {
      setFormData({
        name: '',
        industry: '',
        description: '',
        themeColor: '#4F46E5',
      });
    }
  }, [company]);

  if (!isOpen) return null;

  const isEditing = Boolean(company?._id);

  let submitButtonText = 'Créer l\'entreprise';
  if (saving) {
    submitButtonText = 'Enregistrement...';
  } else if (isEditing) {
    submitButtonText = 'Mettre à jour';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Le nom de l\'entreprise est obligatoire');
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      alert('Erreur enregistrement entreprise : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Modifier l\'entreprise' : 'Créer une nouvelle organisation (Tenant)'}
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
            <label htmlFor="company-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Nom de l&apos;entreprise *
            </label>
            <input
              id="company-name-input"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: TechNova Solutions"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="company-industry-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Secteur d&apos;activité
            </label>
            <input
              id="company-industry-input"
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="Ex: Cloud B2B, Logistique, Santé..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="company-desc-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Description
            </label>
            <textarea
              id="company-desc-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description de l'activité..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Couleur d'identité visuelle */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Couleur visuelle
            </span>
            <div className="flex items-center space-x-2">
              {THEME_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, themeColor: c })}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    formData.themeColor === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
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
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
