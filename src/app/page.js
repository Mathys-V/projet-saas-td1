'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="h-96 flex items-center justify-center text-slate-400">
      <div className="animate-pulse flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
        <span>Chargement de MultiTask SaaS...</span>
      </div>
    </div>
  );
}
