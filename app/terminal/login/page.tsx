'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TerminalLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/terminal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao fazer login');
        return;
      }

      // Salvar dados no localStorage
      localStorage.setItem('terminalSession', JSON.stringify(data));
      
      // Redirecionar para pesquisa
      router.push('/terminal/survey');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 shadow-2xl">
        <CardHeader className="text-center pb-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <Image
                src="/logo-backeend.png"
                alt="Backeend Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          
          <CardTitle className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-wide">
            Acesso Terminal
          </CardTitle>
          <p className="text-gray-400 mt-3 text-sm">
            Insira as credenciais do terminal
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                Email do Terminal
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="terminal@totem.beend.tech"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12 text-base"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 uppercase tracking-wide shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
