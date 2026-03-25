'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function TerminalPanelLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/terminal-panel/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao fazer login');
        return;
      }

      toast.success(`Bem-vindo, ${data.terminal.name}!`);
      router.push('/terminal-panel/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="relative w-32 h-16">
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
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Monitor className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl">Painel do Terminal</CardTitle>
          </div>
          <CardDescription>
            Acesse o painel de visualização do terminal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Terminal</Label>
              <Input
                id="email"
                type="email"
                placeholder="terminal@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Acesso exclusivo para terminais cadastrados</p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-muted-foreground bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <p className="text-xs md:text-sm">
          © {new Date().getFullYear()} Backeend - Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
