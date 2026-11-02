'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './Context';
import {
  Building2,
  Users,
  FolderKanban,
  LayoutDashboard,
  CheckSquare,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const {
    companies,
    activeCompany,
    companyUsers,
    activeUser,
    switchCompany,
    switchUser,
    logout,
    reloadCompanies,
  } = useApp();

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemo = async () => {
    if (!confirm('Voulez-vous réinitialiser toutes les données de démonstration (TechNova & GreenLogistique) ?')) {
      return;
    }
    try {
      setIsResetting(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        await reloadCompanies();
        window.location.reload();
      }
    } catch (err) {
      alert('Erreur lors de la réinitialisation: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/kanban', label: 'Kanban', icon: CheckSquare },
    { href: '/projects', label: 'Projets', icon: FolderKanban },
    { href: '/users', label: 'Équipe', icon: Users },
    { href: '/companies', label: 'Entreprises', icon: Building2 },
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-6 min-w-0">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2.5 shrink-0 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 shrink-0"
                style={{ backgroundColor: activeCompany?.themeColor || '#4F46E5' }}
              >
                <FolderKanban className="w-5 h-5" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center space-x-1.5 leading-none">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                    MultiTask<span className="text-indigo-600">SaaS</span>
                  </span>
                  <span className="hidden xl:inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase whitespace-nowrap leading-none">
                    Multi-Tenant
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 hidden xl:block">
                  Isolation logicielle stricte
                </span>
              </div>
            </Link>

            {/* Navigation principale */}
            <nav className="hidden lg:flex items-center space-x-1 shrink-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href === '/dashboard' && pathname === '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sélecteurs de contexte (Multi-Tenant & Utilisateur Actif) */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Sélecteur rapide d'entreprise */}
            <div className="relative">
              <button
                onClick={() => {
                  setCompanyDropdownOpen(!companyDropdownOpen);
                  setUserDropdownOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-all shadow-sm"
                title="Changer d'entreprise (cloisonnement strict)"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white shrink-0"
                  style={{ backgroundColor: activeCompany?.themeColor || '#4F46E5' }}
                />
                <span className="max-w-[120px] truncate">
                  {activeCompany ? activeCompany.name : 'Sélectionner'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {companyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Espace Entreprise (Tenant)</span>
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {companies.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => {
                          switchCompany(c._id);
                          setCompanyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          activeCompany?._id === c._id ? 'bg-indigo-50/70 text-indigo-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.themeColor || '#4F46E5' }}
                          />
                          <span className="truncate">{c.name}</span>
                        </div>
                        {activeCompany?._id === c._id && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
                            Actif
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pt-1 border-t border-slate-100 px-2">
                    <Link
                      href="/companies"
                      onClick={() => setCompanyDropdownOpen(false)}
                      className="w-full text-center block py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 rounded"
                    >
                      + Gérer les entreprises
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sélecteur d'utilisateur actif & Rôle */}
            <div className="relative">
              {activeUser ? (
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setCompanyDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-all shadow-sm"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: activeUser.avatarColor || '#10B981' }}
                  >
                    {activeUser.fullName ? activeUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate hidden sm:inline-block">
                    {activeUser.fullName}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${getRoleBadgeColor(
                      activeUser.role
                    )}`}
                  >
                    {activeUser.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <Link
                    href="/login"
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Connexion</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Inscription</span>
                  </Link>
                </div>
              )}

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Collaborateur Actif</span>
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {companyUsers.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => {
                          switchUser(u._id);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          activeUser?._id === u._id ? 'bg-indigo-50/70 text-indigo-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: u.avatarColor || '#10B981' }}
                          >
                            {u.fullName?.charAt(0)}
                          </div>
                          <div className="truncate">
                            <span className="block truncate font-medium">{u.fullName}</span>
                            <span className="text-[10px] text-slate-400 block">{u.jobTitle}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-semibold px-1 py-0.5 rounded border shrink-0 ${getRoleBadgeColor(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-slate-100 px-2 space-y-1">
                    <Link
                      href="/users"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-center block py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 rounded"
                    >
                      + Gérer l&apos;équipe
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-center block py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-50 rounded"
                    >
                      Changer de compte
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-center py-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium hover:bg-rose-50 rounded flex items-center justify-center space-x-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton Réinitialiser la Démo */}
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              title="Réinitialiser les données de démonstration (TechNova / GreenLogistique)"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
