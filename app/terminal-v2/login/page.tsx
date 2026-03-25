'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';

export default function TerminalV2LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // FORÇAR DARK MODE
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    
    // Limpar sessão anterior ao carregar a página
    if (typeof window !== 'undefined') {
      localStorage.removeItem('terminalSession');
      localStorage.removeItem('terminalSessionV2');
      localStorage.removeItem('selectedCampaign');
      localStorage.removeItem('theme');
      localStorage.removeItem('color-scheme');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
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
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Verificar se há campanhas disponíveis
      if (!data.campaigns || data.campaigns.length === 0) {
        throw new Error('Nenhuma campanha vinculada a este terminal');
      }

      // Salvar sessão no localStorage (formato unificado)
      localStorage.setItem(
        'terminalSession',
        JSON.stringify({
          terminalId: data.terminal.id,
          terminalName: data.terminal.name,
          userId: data.user?.id,
          userEmail: data.terminal.email,
          userName: data.user?.name || data.user?.companyName,
          companyLogo: data.user?.logo,
          timestamp: Date.now(),
        })
      );

      // Também salvar no formato antigo para compatibilidade
      if (data.campaign) {
        localStorage.setItem(
          'terminalSessionV2',
          JSON.stringify({
            terminalId: data.terminal.id,
            terminalName: data.terminal.name,
            campaignId: data.campaign.id,
            campaignTitle: data.campaign.title,
            campaignDescription: data.campaign.description,
            questions: data.campaign.questions,
            lgpdText: data.campaign.lgpdText,
            collectName: data.campaign.collectName,
            collectPhone: data.campaign.collectPhone,
            collectEmail: data.campaign.collectEmail,
            userId: data.user?.id,
            userEmail: data.terminal.email,
            userName: data.user?.name || data.user?.companyName,
            companyLogo: data.user?.logo,
            timestamp: Date.now(),
          })
        );
      }

      toast.success('Login realizado com sucesso!');

      // Se tiver mais de uma campanha, vai para seleção
      // Se tiver apenas uma, vai direto para a pesquisa
      if (data.campaigns.length > 1) {
        router.push('/terminal-v2/select-campaign');
      } else {
        // Salvar campanha única selecionada
        const tc = data.campaigns[0];
        localStorage.setItem('selectedCampaign', JSON.stringify({
          terminalCampaignId: tc.id,
          campaignId: tc.campaign.id,
          campaignTitle: tc.customTitle || tc.campaign.title,
          uniqueLink: tc.campaign.uniqueLink,
        }));
        router.push('/terminal-v2/survey');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null; // Evita flash de tema incorreto
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center mb-10">
            {/* Logo Backeend */}
            <div className="relative w-72 h-20 mb-4">
              <Image
                src="/logo-dark.png"
                alt="Back&end Logo"
                fill
                className="object-contain"
                priority
                quality={100}
              />
            </div>
            
            <p className="text-muted-foreground text-center mt-4 text-sm">
              Sistema de Pesquisa de Satisfação
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                E-mail do Terminal
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="terminal@empresa.com"
                required
                className="h-12 text-lg"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                className="h-12 text-lg"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
