'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AppContext = createContext(null);

function resolveActiveUser(usersData, preferredUserId) {
  if (!Array.isArray(usersData) || usersData.length === 0) return null;
  const savedUserId = preferredUserId || (typeof window !== 'undefined' ? localStorage.getItem('saas_active_user_id') : null);
  if (savedUserId) {
    const found = usersData.find((u) => u._id === savedUserId);
    if (found) return found;
  }
  return usersData[0];
}

function resolveActiveProject(projectsData) {
  if (!Array.isArray(projectsData) || projectsData.length === 0) return null;
  const savedProjId = typeof window !== 'undefined' ? localStorage.getItem('saas_active_project_id') : null;
  if (savedProjId) {
    const found = projectsData.find((p) => p._id === savedProjId);
    if (found) return found;
  }
  return projectsData[0];
}

export function AppProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [companyProjects, setCompanyProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les utilisateurs et projets de l'entreprise active
  const loadCompanyData = useCallback(async (companyId, preferredUserId = null) => {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        fetch(`/api/users?companyId=${companyId}`),
        fetch(`/api/projects?companyId=${companyId}`),
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : [];
      const projectsData = projectsRes.ok ? await projectsRes.json() : [];

      setCompanyUsers(usersData);
      setCompanyProjects(projectsData);

      const currentUser = resolveActiveUser(usersData, preferredUserId);
      setActiveUser(currentUser);
      if (currentUser && typeof window !== 'undefined') {
        localStorage.setItem('saas_active_user_id', currentUser._id);
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

  // Charger les entreprises et initialiser la base (seed automatique)
  const loadCompanies = useCallback(async (preferredCompanyId = null, preferredUserId = null) => {
    try {
      setLoading(true);
      setError(null);
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
        if (!currentComp) {
          currentComp = data[0];
        }

        setActiveCompany(currentComp);
        if (typeof window !== 'undefined') {
          localStorage.setItem('saas_active_company_id', currentComp._id);
        }

        await loadCompanyData(currentComp._id, preferredUserId);
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
      await loadCompanyData(found._id);
    }
  }, [companies, loadCompanyData]);

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

  // Connexion
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
        await loadCompanies(data.company._id, data.user._id);
        return { success: true, user: data.user, company: data.company };
      }
      return { success: false, error: 'Réponse incomplète' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [loadCompanies]);

  // Inscription
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
        await loadCompanies(data.company._id, data.user._id);
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saas_active_user_id');
    }
  }, []);

  // Rafraîchir les données de l'entreprise
  const refreshCompanyData = useCallback(async () => {
    if (activeCompany) {
      await loadCompanyData(activeCompany._id, activeUser?._id);
    }
  }, [activeCompany, activeUser, loadCompanyData]);

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
    loading,
    error,
    switchCompany,
    switchUser,
    switchProject,
    login,
    register,
    logout,
    refreshCompanyData,
    reloadCompanies: loadCompanies,
  }), [
    companies,
    activeCompany,
    companyUsers,
    activeUser,
    companyProjects,
    activeProject,
    loading,
    error,
    switchCompany,
    switchUser,
    switchProject,
    login,
    register,
    logout,
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
