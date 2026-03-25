'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { BarChart3, LogOut, Settings, Users, Moon, Sun, User, Monitor, UserCheck, HelpCircle, FileText, Mail, Contact } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);

  // Evitar erro de hidratação
  useEffect(() => {
    setMounted(true);
    // Ler viewAsUser do URL apenas no client-side
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setViewAsUserId(params.get('viewAsUser'));
    }
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const isActive = (path: string) => pathname === path;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const buildLink = (basePath: string) => {
    if (viewAsUserId) {
      return `${basePath}?viewAsUser=${viewAsUserId}`;
    }
    return basePath;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <Image 
              src="/logo.png" 
              alt="Back&end Logo" 
              width={160} 
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {session && (
            <nav className="flex items-center space-x-2">
              <Link href={buildLink('/dashboard')}>
                <Button
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>

              <Link href={buildLink('/campaigns')}>
                <Button
                  variant={isActive('/campaigns') ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Campanhas
                </Button>
              </Link>

              <Link href={buildLink('/terminals')}>
                <Button
                  variant={pathname?.startsWith('/terminals') ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Terminais
                </Button>
              </Link>

              <Link href={buildLink('/respondents')}>
                <Button
                  variant={pathname?.startsWith('/respondents') ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Respondentes
                </Button>
              </Link>

              <Link href={buildLink('/contacts')}>
                <Button
                  variant={pathname?.startsWith('/contacts') ? 'default' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  title="Contatos"
                >
                  <Contact className="h-4 w-4" />
                </Button>
              </Link>

              <Link href={buildLink('/email-campaigns')}>
                <Button
                  variant={pathname?.startsWith('/email-campaigns') ? 'default' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  title="Email Marketing"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </Link>

              {session?.user?.role === 'ADMIN' && !viewAsUserId && (
                <Link href={buildLink('/proposals')}>
                  <Button
                    variant={pathname?.startsWith('/proposals') ? 'default' : 'ghost'}
                    size="icon"
                    className="h-9 w-9"
                    title="Propostas"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {session?.user?.role === 'ADMIN' && !viewAsUserId && (
                <Link href="/admin/users">
                  <Button
                    variant={isActive('/admin/users') ? 'default' : 'ghost'}
                    size="icon"
                    className="h-9 w-9"
                    title="Usuários"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              <Link href={buildLink('/profile')}>
                <Button
                  variant={isActive('/profile') ? 'default' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  title="Perfil"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>

              <div className="ml-4 flex items-center gap-3">
                {/* Botão de ajuda (apenas ícone) */}
                <Link href="/help">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    title="Central de Ajuda"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </Link>

                {/* Botão de tema */}
                {mounted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="flex items-center gap-2"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {mounted && session?.user?.name && (
                  <span className="text-sm text-muted-foreground">{session.user.name}</span>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
