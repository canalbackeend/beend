'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, RotateCcw, Eye } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  uniqueLink: string;
  _count: { responses: number };
  questions: any[];
  createdAt: string;
}

export function CampaignsContent() {
  const searchParams = useSearchParams();
  const viewAsUserId = searchParams?.get('viewAsUser');
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [resetting, setResetting] = useState(false);
  const [viewingUserName, setViewingUserName] = useState<string>('');

  useEffect(() => {
    fetchCampaigns();
  }, [viewAsUserId]);

  const fetchCampaigns = async () => {
    try {
      const url = viewAsUserId ? `/api/campaigns?viewAsUser=${viewAsUserId}` : '/api/campaigns';
      const response = await fetch(url);
      const data = await response.json();
      setCampaigns(data ?? []);
      
      // Se estamos visualizando como outro usuário, buscar o nome dele
      if (viewAsUserId) {
        const userResponse = await fetch(`/api/users/profile?viewAsUser=${viewAsUserId}`);
        const userData = await userResponse.json();
        setViewingUserName(userData.name || 'Usuário');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const toggleStatus = async (campaign: Campaign) => {
    try {
      await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: campaign.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
        }),
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const openResetDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowResetDialog(true);
  };

  const resetCampaignData = async () => {
    if (!selectedCampaign) return;

    setResetting(true);
    try {
      const response = await fetch(`/api/campaigns/${selectedCampaign.id}/responses`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao resetar dados');
      }

      const data = await response.json();
      toast.success(`${data.deletedCount} resposta(s) removida(s) com sucesso`);
      fetchCampaigns();
      setShowResetDialog(false);
    } catch (error) {
      console.error('Error resetting campaign data:', error);
      toast.error('Erro ao resetar dados da campanha');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-muted-foreground">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner de visualização como outro usuário */}
      {viewAsUserId && viewingUserName && (
        <Card className="border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Visualizando campanhas de <span className="font-bold">{viewingUserName}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Campanhas
          </h1>
          <p className="text-muted-foreground mt-2">Gerencie suas pesquisas de satisfação</p>
        </div>
        <Link href="/campaigns/new">
          <Button size="lg" className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Campanha
          </Button>
        </Link>
      </div>

      {/* Lista de campanhas */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-6xl"></div>
          <h2 className="text-2xl font-bold">Nenhuma campanha criada</h2>
          <p className="text-muted-foreground">Crie sua primeira campanha para começar</p>
          <Link href="/campaigns/new">
            <Button size="lg">Criar Primeira Campanha</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns?.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{campaign.title}</CardTitle>
                      <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {campaign.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">{campaign.description || 'Sem descrição'}</CardDescription>
                  </div>
                  <div className="text-3xl"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Respostas</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign._count?.responses ?? 0}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Perguntas</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign.questions?.length ?? 0}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Criada em</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{new Date(campaign.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/campaigns/${campaign.id}/edit`}>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(campaign)}>
                    {campaign.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openResetDialog(campaign)} 
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    disabled={campaign._count?.responses === 0}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Resetar Dados
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteCampaign(campaign.id)} className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AlertDialog Reset */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Dados da Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover <strong>TODAS as respostas</strong> da campanha &quot;{selectedCampaign?.title}&quot;.
              <br /><br />
              <span className="text-orange-600 font-semibold">⚠️ Esta ação não pode ser desfeita!</span>
              <br /><br />
              Você tem certeza que deseja continuar? Esta função é útil para limpar dados de teste antes de colocar a campanha em produção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={resetCampaignData} 
              disabled={resetting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {resetting ? 'Resetando...' : 'Sim, Resetar Dados'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
