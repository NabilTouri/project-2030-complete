'use client';

import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User, Palette, Bell, Globe, LogOut, ChevronRight,
  Shield, Target, Utensils,
} from 'lucide-react';
import { generateAvatarDataUri } from '@/lib/avatar';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`
    : '??';

  const avatarSrc = profile?.avatar_url
    || (profile ? generateAvatarDataUri(profile.first_name, profile.last_name) : '');

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { href: '/settings/profile', icon: User, label: 'Dati Personali', desc: 'Nome, peso, altezza, obiettivo' },
        { href: '/settings/profile#conditions', icon: Shield, label: 'Condizioni Fisiche', desc: 'Gestisci le tue condizioni' },
        { href: '/settings/profile#macros', icon: Utensils, label: 'Obiettivi Macro', desc: 'Calorie, proteine, carbo, grassi' },
        { href: '/settings/profile#countdown', icon: Target, label: 'Data Obiettivo', desc: profile?.countdown_target || '2030-05-03' },
      ],
    },
    {
      title: 'Aspetto',
      items: [],
    },
    {
      title: 'Notifiche',
      items: [
        { href: '#', icon: Bell, label: 'Notifiche Push', desc: 'Promemoria e avvisi' },
      ],
    },
  ];

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Impostazioni</h1>

      {/* Profile card */}
      <div className="rounded-xl bg-card border border-border p-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={avatarSrc} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-sm text-muted-foreground">{profile?.goal || 'Nessun obiettivo impostato'}</p>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 px-1">
            {section.title}
          </h2>

          {section.title === 'Aspetto' ? (
            <div className="rounded-xl bg-card border border-border divide-y divide-border">
              {/* Theme */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Palette size={18} className="text-muted-foreground" />
                  <span className="text-sm">Tema</span>
                </div>
                <div className="flex gap-2 ml-8">
                  {[
                    { value: 'system', label: 'Sistema' },
                    { value: 'light', label: 'Chiaro' },
                    { value: 'dark', label: 'Scuro' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        theme === t.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Globe size={18} className="text-muted-foreground" />
                  <span className="text-sm">Lingua</span>
                </div>
                <div className="flex gap-2 ml-8">
                  {[
                    { value: 'it', label: '🇮🇹 Italiano' },
                    { value: 'en', label: '🇬🇧 English' },
                  ].map((l) => (
                    <button
                      key={l.value}
                      onClick={async () => {
                        if (profile) {
                          await supabase
                            .from('profiles')
                            .update({ language: l.value })
                            .eq('id', profile.id);
                          toast.success(`Lingua cambiata: ${l.label}`);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        profile?.language === l.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border divide-y divide-border">
              {section.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      <Separator className="my-6" />

      <Button variant="outline" onClick={handleLogout} className="w-full gap-2 text-destructive hover:text-destructive">
        <LogOut size={16} />
        Esci
      </Button>
    </div>
  );
}
