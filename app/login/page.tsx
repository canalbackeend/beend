'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou senha inválidos');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Back&end Logo" 
              width={240} 
              height={60}
              className="h-16 w-auto"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Pesquisa de Satisfação</CardTitle>
          <CardDescription className="text-base">Entre para gerenciar suas pesquisas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
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
                required
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
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
          {mounted && (
            <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground space-y-1.5">
              <p className="mb-3">
                <a href="/terminal-panel/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Acesso exclusivo para Terminais →
                </a>
              </p>
              <p className="font-medium">
                © Backeend {new Date().getFullYear()} - Todos os direitos reservados
              </p>
              <p>
                <strong>Suporte Técnico:</strong>{' '}
                <a href="mailto:canalbackeend@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  canalbackeend@gmail.com
                </a>
              </p>
              <p>
                <strong>WhatsApp:</strong>{' '}
                <a href="https://wa.me/5561995957461" target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline">
                  +55 (61) 9 9595-7461
                </a>
              </p>
              <p>Brasília/DF - Brasil</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
