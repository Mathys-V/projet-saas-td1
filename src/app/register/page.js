'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/Context';
import {
  Building2,
  UserPlus,
  Mail,
  Lock,
  User,
  Briefcase,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, companies } = useApp();

  const [mode, setMode] = useState('new_company'); // 'new_company' | 'join_company'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Formulaire nouvelle entreprise
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');
  const [themeColor, setThemeColor] = useState('#4F46E5');

  // Formulaire utilisateur
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [role, setRole] = useState('MEMBER');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        mode,
        fullName,
        email,
        password,
        jobTitle,
      };

      if (mode === 'new_company') {
        payload.companyName = companyName;
        payload.industry = industry;
        payload.description = companyDesc;
        payload.themeColor = themeColor;
      } else {
        payload.companyId = selectedCompanyId;
        payload.role = role;
      }

      const res = await register(payload);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Inscription SaaS</h2>
          <p className="text-xs text-slate-500">
            Créez une organisation isolée ou rejoignez une équipe
          </p>
        </div>

        {/* Onglets de sélection du mode */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('new_company');
              setError('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              mode === 'new_company'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Nouvelle Entreprise</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('join_company');
              setError('');
              if (companies.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(companies[0]._id);
              }
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              mode === 'join_company'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Rejoindre une Équipe</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'new_company' ? (
            /* Champs pour nouvelle entreprise */
            <div className="space-y-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Informations de l&apos;Organisation (Tenant)</span>
              </span>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom de l&apos;entreprise *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Acme Dynamics"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Secteur d&apos;activité
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Ex: SaaS, E-commerce, Conseil..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Couleur visuelle
                  </label>
                  <select
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="#4F46E5">Indigo (#4F46E5)</option>
                    <option value="#059669">Émeraude (#059669)</option>
                    <option value="#2563EB">Bleu Océan (#2563EB)</option>
                    <option value="#D97706">Ambre (#D97706)</option>
                    <option value="#EC4899">Rose (#EC4899)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* Sélection de l'entreprise existante */
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Sélectionner l&apos;Entreprise Cliente</span>
              </span>

              <div>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  required
                >
                  <option value="">Sélectionnez une entreprise...</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.industry || 'Général'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rôle demandé
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="MEMBER">Membre (Opérationnel Kanban)</option>
                  <option value="MANAGER">Chef de projet (Manager)</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
            </div>
          )}

          {/* Informations personnelles */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Compte Collaborateur {mode === 'new_company' ? '(Administrateur)' : ''}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Alice Martin"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Poste / Titre
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ex: Lead Developer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse e-mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice.martin@entreprise.io"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mot de passe *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (ex: password123)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Création en cours...</span>
            ) : (
              <>
                <span>
                  {mode === 'new_company'
                    ? 'Créer l\'entreprise et mon compte'
                    : 'Rejoindre l\'entreprise'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          <span>Déjà inscrit ? </span>
          <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-800 underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
