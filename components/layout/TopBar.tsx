'use client';

import { Settings, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/stores/useAppStore';
import Link from 'next/link';

export default function TopBar() {
  const { profile } = useAppStore();

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`
    : '??';
  const greeting = profile ? `Ciao, ${profile.first_name}` : 'Ciao';

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border md:border-0">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={profile?.avatar_url || ''} alt={greeting} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{greeting}</span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Settings size={18} className="text-muted-foreground" />
          </Link>
          <button className="p-2 rounded-lg hover:bg-accent transition-colors relative">
            <Bell size={18} className="text-muted-foreground" />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-red" />
          </button>
        </div>
      </div>
    </header>
  );
}
