'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [companyProjects, setCompanyProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les entreprises et initialiser la base (seed automatique)
  const loadCompanies = useCallback(async (preferredCompanyId = null, preferredUserId = null) => {
    try {
      setLoading(true);
      setError(null);
      // Appel API companies (déclenche aussi le seed si vide)
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Impossible de charger les entreprises');
      const data = await res.json();
      setCompanies(data);

      if (data && data.length > 0) {
        // Trouver l'entreprise active
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

        // Charger les utilisateurs de cette entreprise
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
  }, []);

  // Charger les utilisateurs et projets de l'entreprise active
  const loadCompanyData = async (companyId, preferredUserId = null) => {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        fetch(`/api/users?companyId=${companyId}`),
        fetch(`/api/projects?companyId=${companyId}`),
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : [];
      const projectsData = projectsRes.ok ? await projectsRes.json() : [];

      setCompanyUsers(usersData);
      setCompanyProjects(projectsData);

      // Définir l'utilisateur actif
      let currentUser = null;
      const savedUserId = preferredUserId || (typeof window !== 'undefined' ? localStorage.getItem('saas_active_user_id') : null);

      if (savedUserId && Array.isArray(usersData)) {
        currentUser = usersData.find((u) => u._id === savedUserId);
      }
      if (!currentUser && Array.isArray(usersData) && usersData.length > 0) {
        currentUser = usersData[0];
      }

      setActiveUser(currentUser);
      if (currentUser && typeof window !== 'undefined') {
        localStorage.setItem('saas_active_user_id', currentUser._id);
      }

      // Définir le projet actif
      let currentProj = null;
      const savedProjId = typeof window !== 'undefined' ? localStorage.getItem('saas_active_project_id') : null;

      if (savedProjId && Array.isArray(projectsData)) {
        currentProj = projectsData.find((p) => p._id === savedProjId);
      }
      if (!currentProj && Array.isArray(projectsData) && projectsData.length > 0) {
        currentProj = projectsData[0];
      }

      setActiveProject(currentProj);
      if (currentProj && typeof window !== 'undefined') {
        localStorage.setItem('saas_active_project_id', currentProj._id);
      }

      setLoading(false);
    } catch (err) {
      console.error('Erreur loadCompanyData:', err);
      setLoading(false);
    }
  };

  // Basculer d'entreprise (Multi-tenant switch)
  const switchCompany = async (companyId) => {
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
  };

  // Basculer d'utilisateur actif
  const switchUser = (userId) => {
    const found = companyUsers.find((u) => u._id === userId);
    if (found) {
      setActiveUser(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_active_user_id', found._id);
      }
    }
  };

  // Basculer de projet actif
  const switchProject = (projectId) => {
    const found = companyProjects.find((p) => p._id === projectId);
    if (found) {
      setActiveProject(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_active_project_id', found._id);
      }
    }
  };

  // Connexion
  const login = async (email, password) => {
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
  };

  // Inscription
  const register = async (registerData) => {
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
  };

  // Déconnexion
  const logout = () => {
    setActiveUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saas_active_user_id');
    }
  };

  // Rafraîchir les données de l'entreprise
  const refreshCompanyData = async () => {
    if (activeCompany) {
      await loadCompanyData(activeCompany._id, activeUser?._id);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
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
