'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Monitor, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

interface Campaign {
  id: string;
  title: string;
  status: string;
}

export default function NewTerminalPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data ?? []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Por favor, informe o nome do terminal');
      return;
    }

    if (!campaignId) {
      toast.error('Por favor, selecione uma campanha');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/terminals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          campaignId,
          redirectUrl: redirectUrl.trim() || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar terminal');
      }

      const terminal = await response.json();

      toast.success('Terminal criado com sucesso!');
      toast.success(`Email: ${terminal.email} | Senha: term123`, {
        duration: 5000,
      });
      
      router.push('/terminals');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar terminal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8 flex-grow">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/terminals">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Novo Terminal
              </h1>
              <p className="text-muted-foreground mt-1">Crie um novo terminal para suas campanhas</p>
            </div>
          </div>

          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                Informações do Terminal
              </CardTitle>
              <CardDescription>
                Após criar o terminal, serão geradas credenciais de acesso automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome do Terminal */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Terminal *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Terminal Loja 01"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Campanha */}
                <div className="space-y-2">
                  <Label htmlFor="campaign">Campanha Associada *</Label>
                  {loadingCampaigns ? (
                    <div className="text-sm text-muted-foreground">Carregando campanhas...</div>
                  ) : campaigns.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Você precisa criar uma campanha antes de criar um terminal.
                      </p>
                      <Link href="/campaigns/new">
                        <Button type="button" variant="outline" size="sm">
                          Criar Campanha
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Select value={campaignId} onValueChange={setCampaignId} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma campanha" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.title}
                            {campaign.status === 'INACTIVE' && ' (Inativa)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* URL de Redirecionamento */}
                <div className="space-y-2">
                  <Label htmlFor="redirectUrl">
                    URL de Redirecionamento (Opcional)
                  </Label>
                  <Input
                    id="redirectUrl"
                    type="url"
                    placeholder="https://www.exemplo.com.br"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se preenchida, o usuário será redirecionado para este site após completar a pesquisa (aguarda 5 segundos)
                  </p>
                </div>

                {/* Informações sobre as credenciais */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                    🔑 Credenciais Automáticas
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>• Email: Será gerado automaticamente (ex: term01@beend.app)</p>
                    <p>• Senha padrão: <strong>term123</strong></p>
                    <p className="text-xs mt-2 text-blue-700 dark:text-blue-300">
                      As credenciais serão exibidas após a criação do terminal
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <Link href="/terminals" className="flex-1">
                    <Button type="button" variant="outline" className="w-full" disabled={loading}>
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={loading || campaigns.length === 0}
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Criando...' : 'Criar Terminal'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
