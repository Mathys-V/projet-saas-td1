'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/Context';
import {
  LogIn,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  UserCheck,
  Building2,
  ShieldCheck,
  FlaskConical,
  RotateCcw,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, enableDemoMode, reloadCompanies } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoSection, setShowDemoSection] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Connexion standard (Mode Normal)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Activer le mode démo direct
  const handleStartDemo = async (demoEmail = 'alice.martin@technova.io') => {
    setError('');
    setLoading(true);
    try {
      await enableDemoMode(demoEmail);
      router.push('/dashboard');
    } catch (err) {
      setError('Erreur lors de l\'activation du mode démo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSeed = async () => {
    if (!confirm('Voulez-vous réinitialiser toutes les données de test (TechNova et GreenLogistique) ?')) {
      return;
    }
    try {
      setIsResetting(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        await reloadCompanies();
        alert('Données de démo réinitialisées avec succès !');
      }
    } catch (err) {
      alert('Erreur lors de la réinitialisation: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const demoAccounts = [
    {
      company: 'TechNova Solutions (Tenant 1)',
      name: 'Alice Martin',
      role: 'ADMIN (CTO)',
      email: 'alice.martin@technova.io',
      color: '#4F46E5',
      desc: 'Accès complet, gestion des projets et des membres',
    },
    {
      company: 'TechNova Solutions (Tenant 1)',
      name: 'Lucas Bernard',
      role: 'MANAGER (Product)',
      email: 'lucas.bernard@technova.io',
      color: '#0EA5E9',
      desc: 'Gestion des projets et Kanban',
    },
    {
      company: 'GreenLogistique (Tenant 2 - Isolation)',
      name: 'Marc Lefèvre',
      role: 'ADMIN (Ops)',
      email: 'marc.lefevre@greenlog.fr',
      color: '#059669',
      desc: 'Données 100% isolées de TechNova (RG-01)',
    },
  ];

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Carte principale de connexion */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Connexion SaaS</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Connectez-vous à votre espace de travail d&apos;entreprise multi-tenant en mode standard.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire standard */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@entreprise.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Connexion en cours...</span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Liens Inscription */}
        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <span>Vous n&apos;avez pas encore de compte ? </span>
          <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-800 underline">
            Créer une nouvelle entreprise ou s&apos;inscrire
          </Link>
        </div>
      </div>

      {/* BLOC MODE TEST & DÉMONSTRATION (Pour évaluation et tests rapides) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-800/40 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400">
                <FlaskConical className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm font-bold tracking-tight">Mode Test & Démonstration</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                Évaluation
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Accédez instantanément à l&apos;environnement de test avec deux entreprises pré-chargées (TechNova & GreenLogistique), leurs projets et le Kanban.
            </p>
          </div>

          <button
            onClick={handleResetSeed}
            disabled={isResetting}
            title="Réinitialiser la base de démo"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center space-x-1 text-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline text-[11px]">Reset Seed</span>
          </button>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => void handleStartDemo('alice.martin@technova.io')}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Entrer en Mode Test (Alice Martin)</span>
          </button>

          <button
            onClick={() => setShowDemoSection(!showDemoSection)}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
          >
            {showDemoSection ? 'Masquer les comptes' : 'Choisir un autre compte démo...'}
          </button>
        </div>

        {/* Liste déroulante des comptes démo */}
        {showDemoSection && (
          <div className="pt-3 border-t border-white/10 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Comptes de test disponibles :
            </span>
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => void handleStartDemo(account.email)}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-amber-400/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center space-x-1.5">
                      <span>{account.name}</span>
                      <span className="text-[10px] text-slate-300 font-normal">
                        • {account.company}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {account.role} — {account.desc}
                    </span>
                  </div>
                </div>

                <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-amber-300 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rappel d'isolation technique */}
      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Isolation logicielle stricte garantie par le prédicat MongoDB <code>{'{ companyId }'}</code></span>
      </div>
    </div>
  );
}
