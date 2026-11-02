import './globals.css';
import { AppProvider } from '@/components/Context';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'MultiTask SaaS - Plateforme Multi-Entreprises',
  description: 'Application SaaS de Gestion de Projet Multi-Entreprises avec MongoDB et Tableau Kanban interactif',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <AppProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
