'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, RotateCcw, Eye, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [viewAsUserId]);

  const fetchCampaigns = async () => {
    try {
      const url = viewAsUserId ? `/api/campaigns?viewAsUser=${viewAsUserId}` : '/api/campaigns';
      const response = await fetch(url);
      const data = await response.json();
      setCampaigns(data ?? []);
      
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
    setTogglingId(campaign.id);
    try {
      await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: campaign.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
        }),
      });
      toast.success(`Campanha ${campaign.status === 'ACTIVE' ? 'desativada' : 'ativada'} com sucesso!`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
    } finally {
      setTogglingId(null);
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
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Campanhas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie suas pesquisas de satisfação
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button size="lg" className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Campanha
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="text-6xl"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nenhuma campanha criada</h2>
            <p className="text-gray-600 dark:text-gray-400">Crie sua primeira campanha para começar</p>
            <Link href="/campaigns/new">
              <Button size="lg">Criar Primeira Campanha</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Lista de Campanhas</CardTitle>
            <CardDescription className="dark:text-gray-400">
              {campaigns.length} {campaigns.length === 1 ? 'campanha cadastrada' : 'campanhas cadastradas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Status</TableHead>
                    <TableHead className="dark:text-gray-300">Campanha</TableHead>
                    <TableHead className="dark:text-gray-300">Descrição</TableHead>
                    <TableHead className="dark:text-gray-300">Respostas</TableHead>
                    <TableHead className="dark:text-gray-300">Perguntas</TableHead>
                    <TableHead className="dark:text-gray-300">Criada em</TableHead>
                    <TableHead className="text-right dark:text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="dark:border-gray-700 dark:hover:bg-gray-750">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={campaign.status === 'ACTIVE'}
                            onCheckedChange={() => toggleStatus(campaign)}
                            disabled={togglingId === campaign.id}
                          />
                          {campaign.status === 'ACTIVE' ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {campaign.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500 dark:text-gray-400">
                          {campaign.description || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900 dark:text-gray-100">
                          {campaign._count?.responses ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900 dark:text-gray-100">
                          {campaign.questions?.length ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/campaigns/${campaign.id}/edit`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openResetDialog(campaign)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            disabled={campaign._count?.responses === 0}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteCampaign(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
