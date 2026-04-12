'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Dumbbell,
  CalendarClock,
  Salad,
  TrendingUp,
  Settings,
  Target,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/workout', icon: Dumbbell, label: 'Allenamento' },
  { href: '/routine', icon: CalendarClock, label: 'Routine' },
  { href: '/nutrition', icon: Salad, label: 'Alimentazione' },
  { href: '/progress', icon: TrendingUp, label: 'Progressi' },
  { href: '/settings', icon: Settings, label: 'Impostazioni' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[240px] flex-col bg-card border-r border-border z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Target size={20} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight">Project 2030</h1>
          <p className="text-[11px] text-muted-foreground">Il tuo percorso</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={18}
                className={`relative z-10 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />
              <span
                className={`relative z-10 text-sm transition-colors ${
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          © 2026 Project 2030
        </p>
      </div>
    </aside>
  );
}
