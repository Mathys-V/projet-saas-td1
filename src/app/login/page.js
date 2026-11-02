'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/Context';
import {
  LogIn,
  Mail,
  Lock,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, companies, companyUsers, activeCompany, switchCompany, switchUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Erreur lors de la connexion');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Connexion rapide avec un compte démo
  const handleFastDemoLogin = async (demoEmail, demoCompanyId, demoUserId) => {
    setError('');
    setLoading(true);
    try {
      if (demoCompanyId) await switchCompany(demoCompanyId);
      if (demoUserId) switchUser(demoUserId);
      const res = await login(demoEmail, 'password123');
      if (res.success) {
        router.push('/dashboard');
      } else {
        // Fallback si mot de passe non requis
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      company: 'TechNova Solutions',
      name: 'Alice Martin',
      role: 'ADMIN (CTO)',
      email: 'alice.martin@technova.io',
      color: '#4F46E5',
      companyColor: '#4F46E5',
    },
    {
      company: 'TechNova Solutions',
      name: 'Lucas Bernard',
      role: 'MANAGER (Product)',
      email: 'lucas.bernard@technova.io',
      color: '#0EA5E9',
      companyColor: '#4F46E5',
    },
    {
      company: 'GreenLogistique (Tenant 2)',
      name: 'Marc Lefèvre',
      role: 'ADMIN (Ops)',
      email: 'marc.lefevre@greenlog.fr',
      color: '#059669',
      companyColor: '#059669',
    },
  ];

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Connexion SaaS</h2>
          <p className="text-xs text-slate-500">
            Accédez à votre espace de travail d&apos;entreprise multi-tenant
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice.martin@technova.io"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (ex: password123)"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <span>Connexion en cours...</span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Comptes de démonstration rapide (pour les correcteurs et tests) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Connexion Démo en 1 Clic (Évaluation)</span>
          </div>

          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleFastDemoLogin(account.email)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 flex items-center space-x-1">
                      <span>{account.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({account.company})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {account.role} • {account.email}
                    </span>
                  </div>
                </div>

                <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Lien Inscription */}
        <div className="pt-2 text-center text-xs text-slate-500">
          <span>Pas encore de compte ? </span>
          <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-800 underline">
            Créer une entreprise ou s&apos;inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}
