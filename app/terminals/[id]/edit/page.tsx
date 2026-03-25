'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Monitor, Save, Key, Plus, Trash2, GripVertical, Palette } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

interface Campaign {
  id: string;
  title: string;
  status: string;
}

interface TerminalCampaign {
  id: string;
  campaignId: string;
  order: number;
  icon: string;
  color: string;
  customTitle: string | null;
  description: string | null;
  campaign: {
    id: string;
    title: string;
  };
}

interface Terminal {
  id: string;
  name: string;
  email: string;
  redirectUrl?: string | null;
  isDefaultPassword: boolean;
  campaigns: TerminalCampaign[];
}

// Ícones disponíveis
const availableIcons = [
  { name: 'faChartBar', label: 'Gráfico de Barras' },
  { name: 'faSmile', label: 'Sorriso' },
  { name: 'faUsers', label: 'Usuários' },
  { name: 'faHospital', label: 'Hospital' },
  { name: 'faBuilding', label: 'Prédio' },
  { name: 'faStore', label: 'Loja' },
  { name: 'faUtensils', label: 'Restaurante' },
  { name: 'faStar', label: 'Estrela' },
  { name: 'faHeart', label: 'Coração' },
  { name: 'faThumbsUp', label: 'Curtir' },
  { name: 'faClipboardList', label: 'Lista' },
  { name: 'faHandshake', label: 'Aperto de Mão' },
];

// Cores pré-definidas
const availableColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export default function EditTerminalPage() {
  const router = useRouter();
  const params = useParams();
  const terminalId = params?.id as string;

  const [name, setName] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [terminalCampaigns, setTerminalCampaigns] = useState<TerminalCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [terminalEmail, setTerminalEmail] = useState('');
  const [isDefaultPassword, setIsDefaultPassword] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [selectedCampaignToAdd, setSelectedCampaignToAdd] = useState('');

  useEffect(() => {
    if (terminalId) {
      fetchData();
    }
  }, [terminalId]);

  const fetchData = async () => {
    try {
      // Buscar terminal
      const terminalResponse = await fetch(`/api/terminals/${terminalId}`);
      if (!terminalResponse.ok) throw new Error('Terminal não encontrado');
      const terminalData: Terminal = await terminalResponse.json();

      setName(terminalData.name);
      setRedirectUrl(terminalData.redirectUrl || '');
      setTerminalEmail(terminalData.email);
      setIsDefaultPassword(terminalData.isDefaultPassword);
      setTerminalCampaigns(terminalData.campaigns || []);

      // Buscar todas as campanhas disponíveis
      const campaignsResponse = await fetch('/api/campaigns');
      const campaignsData = await campaignsResponse.json();
      setAllCampaigns(campaignsData ?? []);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar dados');
      router.push('/terminals');
    } finally {
      setLoadingData(false);
    }
  };

  // Campanhas que ainda não estão vinculadas ao terminal
  const availableCampaigns = allCampaigns.filter(
    c => !terminalCampaigns.some(tc => tc.campaignId === c.id)
  );

  const handleAddCampaign = async () => {
    if (!selectedCampaignToAdd) return;

    try {
      const response = await fetch(`/api/terminals/${terminalId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: selectedCampaignToAdd }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar campanha');
      }

      const newTC = await response.json();
      setTerminalCampaigns(prev => [...prev, newTC]);
      setSelectedCampaignToAdd('');
      toast.success('Campanha adicionada!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveCampaign = async (tcId: string) => {
    try {
      const response = await fetch(`/api/terminals/${terminalId}/campaigns/${tcId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover campanha');
      }

      setTerminalCampaigns(prev => prev.filter(tc => tc.id !== tcId));
      toast.success('Campanha removida!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateCampaignSettings = async (tcId: string, updates: Partial<TerminalCampaign>) => {
    try {
      const response = await fetch(`/api/terminals/${terminalId}/campaigns/${tcId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar campanha');
      }

      const updated = await response.json();
      setTerminalCampaigns(prev => prev.map(tc => tc.id === tcId ? updated : tc));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Por favor, informe o nome do terminal');
      return;
    }

    if (terminalCampaigns.length === 0) {
      toast.error('Por favor, vincule ao menos uma campanha ao terminal');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/terminals/${terminalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          redirectUrl: redirectUrl.trim() || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar terminal');
      }

      toast.success('Terminal atualizado com sucesso!');
      router.push('/terminals');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar terminal');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.error('Por favor, informe a nova senha');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(`/api/terminals/${terminalId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao alterar senha');
      }

      toast.success('Senha do terminal alterada com sucesso!');
      setNewPassword('');
      setIsDefaultPassword(false); // Atualizar estado local
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <main className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-4xl mb-4">💻</div>
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                Editar Terminal
              </h1>
              <p className="text-muted-foreground mt-1">Atualize as informações do terminal</p>
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
                Você pode alterar o nome e a campanha associada ao terminal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Credenciais (somente leitura) */}
                <div className={`border rounded-lg p-4 ${
                  isDefaultPassword 
                    ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                    : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                }`}>
                  <h4 className="font-semibold text-sm mb-3 text-gray-900 dark:text-gray-100">
                    🔑 Credenciais de Acesso
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded border">
                        {terminalEmail}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {isDefaultPassword ? 'Senha Padrão' : 'Senha Personalizada'}
                      </Label>
                      <p className="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded border">
                        {isDefaultPassword ? 'term123' : '••••••••'}
                      </p>
                      {!isDefaultPassword && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          ⚠️ Esta senha foi personalizada e não é mais a padrão
                        </p>
                      )}
                    </div>
                  </div>
                </div>

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

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <Link href="/terminals" className="flex-1">
                    <Button type="button" variant="outline" className="w-full" disabled={loading}>
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                    <Save className="h-4 w-4" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Card de Campanhas Vinculadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Campanhas Vinculadas
              </CardTitle>
              <CardDescription>
                Gerencie as campanhas disponíveis neste terminal. Se houver mais de uma campanha, o operador poderá escolher qual aplicar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de campanhas vinculadas */}
              {terminalCampaigns.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Nenhuma campanha vinculada</p>
                  <p className="text-xs text-muted-foreground mt-1">Adicione ao menos uma campanha abaixo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {terminalCampaigns.map((tc, index) => (
                    <div
                      key={tc.id}
                      className="border rounded-lg p-4 bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        
                        {/* Cor do card */}
                        <div 
                          className="w-8 h-8 rounded-full border-2 cursor-pointer"
                          style={{ backgroundColor: tc.color }}
                          onClick={() => {
                            const nextColor = availableColors[(availableColors.indexOf(tc.color) + 1) % availableColors.length];
                            handleUpdateCampaignSettings(tc.id, { color: nextColor });
                          }}
                        />

                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {tc.campaign.title}
                          </div>
                          <input
                            type="text"
                            placeholder="Título personalizado (opcional)"
                            value={tc.customTitle || ''}
                            onChange={(e) => {
                              const updated = terminalCampaigns.map(t => 
                                t.id === tc.id ? { ...t, customTitle: e.target.value || null } : t
                              );
                              setTerminalCampaigns(updated);
                            }}
                            onBlur={() => handleUpdateCampaignSettings(tc.id, { customTitle: tc.customTitle })}
                            className="text-sm text-gray-500 dark:text-gray-400 w-full bg-transparent border-b border-dashed focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCampaign(tc.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar nova campanha */}
              {availableCampaigns.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Select value={selectedCampaignToAdd} onValueChange={setSelectedCampaignToAdd}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma campanha para adicionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCampaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.title}
                          {campaign.status === 'INACTIVE' && ' (Inativa)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddCampaign} disabled={!selectedCampaignToAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              )}

              {availableCampaigns.length === 0 && terminalCampaigns.length > 0 && (
                <p className="text-sm text-muted-foreground pt-4 border-t">
                  Todas as campanhas disponíveis já estão vinculadas a este terminal.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card de Alteração de Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-orange-600" />
                Alterar Senha do Terminal
              </CardTitle>
              <CardDescription>
                Atualize a senha de acesso do terminal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Digite a nova senha (mínimo 6 caracteres)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={changingPassword}
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha padrão é "term123", mas você pode alterá-la aqui
                  </p>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword}
                  className="w-full gap-2"
                  variant="secondary"
                >
                  <Key className="h-4 w-4" />
                  {changingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
