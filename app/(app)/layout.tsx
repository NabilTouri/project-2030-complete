'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useProfile } from '@/hooks/useProfile';
import { useAppStore } from '@/stores/useAppStore';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile();
  const { setIsLoading } = useAppStore();

  useEffect(() => {
    setIsLoading(loading);
  }, [loading, setIsLoading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-[240px]">
        <TopBar />
        <main className="pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
