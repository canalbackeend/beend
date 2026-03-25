'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Monitor, LayoutDashboard, Users, User, FileText, LogOut, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TerminalNavbarProps {
  terminalName?: string;
  campaignTitle?: string;
  logoUrl?: string | null;
}

export function TerminalNavbar({ terminalName, campaignTitle, logoUrl }: TerminalNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/terminal-panel/auth', { method: 'DELETE' });
      toast.success('Logout realizado com sucesso');
      router.push('/terminal-panel/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const navItems = [
    {
      href: '/terminal-panel/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/terminal-panel/respondents',
      label: 'Respondentes',
      icon: Users,
    },
    {
      href: '/terminal-panel/reports',
      label: 'Relatórios',
      icon: FileText,
    },
    {
      href: '/terminal-panel/profile',
      label: 'Perfil',
      icon: User,
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Nome */}
          <div className="flex items-center gap-4">
            <Link href="/terminal-panel/dashboard" className="flex items-center gap-2">
              <div className="relative w-24 h-10">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                ) : (
                  <>
                    <Image
                      src="/logo-light.png"
                      alt="Logo"
                      fill
                      className="object-contain dark:hidden"
                    />
                    <Image
                      src="/logo-dark.png"
                      alt="Logo"
                      fill
                      className="object-contain hidden dark:block"
                    />
                  </>
                )}
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{terminalName}</span>
              {campaignTitle && (
                <span className="text-muted-foreground">• {campaignTitle}</span>
              )}
            </div>
          </div>

          {/* Menu de Navegação */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}

            {/* Botão de Ajuda */}
            <Link href="/help">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                title="Central de Ajuda"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </Link>

            {/* Botão de Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
