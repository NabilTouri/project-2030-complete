import { create } from 'zustand';
import type { Profile } from '@/lib/types';

interface AppState {
  // Profile
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Current date for dashboard navigation
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),

  selectedDate: new Date(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),

  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
