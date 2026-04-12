'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Dumbbell, CalendarClock, Salad, User } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/workout', icon: Dumbbell, label: 'Workout' },
  { href: '/routine', icon: CalendarClock, label: 'Routine' },
  { href: '/nutrition', icon: Salad, label: 'Nutri' },
  { href: '/settings', icon: User, label: 'Profilo' },
];

export default function BottomNav() {
  const pathname = usePathname();

  const activeIndex = navItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-elevated/80 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item, index) => {
            const isActive = index === activeIndex;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[60px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Safe area padding for iOS */}
      <div className="bg-elevated/80 backdrop-blur-xl h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
