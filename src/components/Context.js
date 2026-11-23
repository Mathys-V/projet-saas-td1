'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AppContext = createContext(null);

function resolveActiveUser(usersData, preferredUserId, isDemoMode) {
  if (!Array.isArray(usersData) || usersData.length === 0) return null;
  const savedUserId = preferredUserId || (typeof window !== 'undefined' ? localStorage.getItem('saas_active_user_id') : null);
  if (savedUserId) {
    const found = usersData.find((u) => u._id === savedUserId);
    if (found) return found;
  }
  // En mode démo, on assigne par défaut le premier utilisateur si aucun n'est sélectionné
  if (isDemoMode) {
    return usersData[0];
  }
  return null;
}

function resolveActiveProject(projectsData) {
  if (!Array.isArray(projectsData) || projectsData.length === 0) return null;
  const savedProjId = typeof window !== 'undefined' ? localStorage.getItem('saas_active_project_id') : null;
  if (savedProjId) {
    const found = projectsData.find((p) => p._id === savedProjId);
    if (found) return found;
  }
  return projectsData[0] || null;
}

export function AppProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [companyProjects, setCompanyProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les utilisateurs et projets de l'entreprise active
  const loadCompanyData = useCallback(async (companyId, preferredUserId = null, demoModeFlag = null) => {
    try {
      const isDemo = demoModeFlag !== null ? demoModeFlag : (typeof window !== 'undefined' && localStorage.getItem('saas_demo_mode') === 'true');

      const [usersRes, projectsRes] = await Promise.all([
        fetch(`/api/users?companyId=${companyId}`),
        fetch(`/api/projects?companyId=${companyId}`),
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : [];
      const projectsData = projectsRes.ok ? await projectsRes.json() : [];

      setCompanyUsers(usersData);
      setCompanyProjects(projectsData);

      const currentUser = resolveActiveUser(usersData, preferredUserId, isDemo);
      setActiveUser(currentUser);
      if (currentUser && typeof window !== 'undefined') {
        localStorage.setItem('saas_active_user_id', currentUser._id);
      } else if (!isDemo && typeof window !== 'undefined') {
        localStorage.removeItem('saas_active_user_id');
      }

      const currentProj = resolveActiveProject(projectsData);
      setActiveProject(currentProj);
      if (currentProj && typeof window !== 'undefined') {
        localStorage.setItem('saas_active_project_id', currentProj._id);
      }

      setLoading(false);
    } catch (err) {
      console.error('Erreur loadCompanyData:', err);
      setLoading(false);
    }
  }, []);

  // Charger les entreprises
  const loadCompanies = useCallback(async (preferredCompanyId = null, preferredUserId = null, forceDemo = null) => {
    try {
      setLoading(true);
      setError(null);

      const demoFlag = forceDemo !== null ? forceDemo : (typeof window !== 'undefined' && localStorage.getItem('saas_demo_mode') === 'true');
      setIsDemoMode(Boolean(demoFlag));

      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Impossible de charger les entreprises');
      const data = await res.json();
      setCompanies(data);

      if (data?.length > 0) {
        let currentComp = null;
        const savedCompId = preferredCompanyId || (typeof window !== 'undefined' ? localStorage.getItem('saas_active_company_id') : null);

        if (savedCompId) {
          currentComp = data.find((c) => c._id === savedCompId);
        }

        // Si aucun compte n'est enregistré : on n'auto-assigne que si on est en mode démo !
        if (!currentComp && demoFlag) {
          currentComp = data[0];
        }

        if (currentComp) {
          setActiveCompany(currentComp);
          if (typeof window !== 'undefined') {
            localStorage.setItem('saas_active_company_id', currentComp._id);
          }
          await loadCompanyData(currentComp._id, preferredUserId, demoFlag);
        } else {
          setActiveCompany(null);
          setActiveUser(null);
          setCompanyUsers([]);
          setCompanyProjects([]);
          setLoading(false);
        }
      } else {
        setActiveCompany(null);
        setActiveUser(null);
        setCompanyUsers([]);
        setCompanyProjects([]);
        setLoading(false);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [loadCompanyData]);

  // Activer le mode démo (chargement des comptes de test)
  const enableDemoMode = useCallback(async (demoEmail = null) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saas_demo_mode', 'true');
    }
    setIsDemoMode(true);

    if (demoEmail) {
      // Connexion directe avec un email démo
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' }),
      });
      const data = await res.json();
      if (res.ok && data.company && data.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('saas_active_company_id', data.company._id);
          localStorage.setItem('saas_active_user_id', data.user._id);
        }
        await loadCompanies(data.company._id, data.user._id, true);
        return { success: true };
      }
    }

    await loadCompanies(null, null, true);
    return { success: true };
  }, [loadCompanies]);

  // Quitter le mode démo
  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setActiveCompany(null);
    setActiveUser(null);
    setCompanyUsers([]);
    setCompanyProjects([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saas_demo_mode');
      localStorage.removeItem('saas_active_company_id');
      localStorage.removeItem('saas_active_user_id');
      localStorage.removeItem('saas_active_project_id');
    }
  }, []);

  // Basculer d'entreprise (Multi-tenant switch)
  const switchCompany = useCallback(async (companyId) => {
    const found = companies.find((c) => c._id === companyId);
    if (found) {
      setActiveCompany(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_active_company_id', found._id);
        localStorage.removeItem('saas_active_user_id');
        localStorage.removeItem('saas_active_project_id');
      }
      await loadCompanyData(found._id, null, isDemoMode);
    }
  }, [companies, loadCompanyData, isDemoMode]);

  // Basculer d'utilisateur actif
  const switchUser = useCallback((userId) => {
    const found = companyUsers.find((u) => u._id === userId);
    if (found) {
      setActiveUser(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_active_user_id', found._id);
      }
    }
  }, [companyUsers]);

  // Basculer de projet actif
  const switchProject = useCallback((projectId) => {
    const found = companyProjects.find((p) => p._id === projectId);
    if (found) {
      setActiveProject(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_active_project_id', found._id);
      }
    }
  }, [companyProjects]);

  // Connexion standard
  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Identifiants invalides');

      if (data.company && data.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('saas_active_company_id', data.company._id);
          localStorage.setItem('saas_active_user_id', data.user._id);
        }
        await loadCompanies(data.company._id, data.user._id, false);
        return { success: true, user: data.user, company: data.company };
      }
      return { success: false, error: 'Réponse incomplète' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [loadCompanies]);

  // Inscription standard
  const register = useCallback(async (registerData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'inscription');

      if (data.company && data.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('saas_active_company_id', data.company._id);
          localStorage.setItem('saas_active_user_id', data.user._id);
        }
        await loadCompanies(data.company._id, data.user._id, false);
        return { success: true, user: data.user, company: data.company };
      }
      return { success: false, error: 'Réponse incomplète' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [loadCompanies]);

  // Déconnexion
  const logout = useCallback(() => {
    setActiveUser(null);
    setActiveCompany(null);
    setIsDemoMode(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saas_demo_mode');
      localStorage.removeItem('saas_active_user_id');
      localStorage.removeItem('saas_active_company_id');
      localStorage.removeItem('saas_active_project_id');
    }
  }, []);

  // Rafraîchir les données de l'entreprise
  const refreshCompanyData = useCallback(async () => {
    if (activeCompany) {
      await loadCompanyData(activeCompany._id, activeUser?._id, isDemoMode);
    }
  }, [activeCompany, activeUser, loadCompanyData, isDemoMode]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const contextValue = useMemo(() => ({
    companies,
    activeCompany,
    companyUsers,
    activeUser,
    companyProjects,
    activeProject,
    isDemoMode,
    isAuthenticated: Boolean(activeUser && activeCompany),
    loading,
    error,
    switchCompany,
    switchUser,
    switchProject,
    login,
    register,
    logout,
    enableDemoMode,
    exitDemoMode,
    refreshCompanyData,
    reloadCompanies: loadCompanies,
  }), [
    companies,
    activeCompany,
    companyUsers,
    activeUser,
    companyProjects,
    activeProject,
    isDemoMode,
    loading,
    error,
    switchCompany,
    switchUser,
    switchProject,
    login,
    register,
    logout,
    enableDemoMode,
    exitDemoMode,
    refreshCompanyData,
    loadCompanies,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp doit être utilisé à l\'intérieur de AppProvider');
  }
  return context;
}
