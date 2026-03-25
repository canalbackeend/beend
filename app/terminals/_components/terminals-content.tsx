'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Plus, Edit, Trash2, Power, PowerOff, Eye, Copy, Check, QrCode } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TerminalCampaign {
  id: string;
  campaignId: string;
  campaign: {
    id: string;
    title: string;
    status: string;
  };
}

interface Terminal {
  id: string;
  name: string;
  email: string;
  uniqueLink: string;
  isActive: boolean;
  isDefaultPassword: boolean;
  campaigns: TerminalCampaign[];
  createdAt: string;
}

export function TerminalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewAsUserId = searchParams?.get('viewAsUser');
  
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [maxTerminals, setMaxTerminals] = useState<number>(1);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewingUserName, setViewingUserName] = useState<string>('');

  useEffect(() => {
    fetchTerminals();
    fetchUserInfo();
  }, [viewAsUserId]);

  const fetchTerminals = async () => {
    try {
      const url = viewAsUserId ? `/api/terminals?viewAsUser=${viewAsUserId}` : '/api/terminals';
      const response = await fetch(url);
      const data = await response.json();
      setTerminals(data ?? []);
    } catch (error) {
      console.error('Error fetching terminals:', error);
      toast.error('Erro ao carregar terminais');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const url = viewAsUserId ? `/api/users/profile?viewAsUser=${viewAsUserId}` : '/api/users/profile';
      const response = await fetch(url);
      const data = await response.json();
      setMaxTerminals(data.maxTerminals || 1);
      
      // Se estamos visualizando como outro usuário, guardar o nome
      if (viewAsUserId) {
        setViewingUserName(data.name || 'Usuário');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const toggleStatus = async (terminal: Terminal) => {
    setTogglingId(terminal.id);
    try {
      const response = await fetch(`/api/terminals/${terminal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !terminal.isActive }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      toast.success(`Terminal ${!terminal.isActive ? 'ativado' : 'desativado'} com sucesso!`);
      fetchTerminals();
    } catch (error) {
      toast.error('Erro ao atualizar status do terminal');
    } finally {
      setTogglingId(null);
    }
  };

  const getTerminalUrl = (terminal: Terminal) => {
    return `${window.location.origin}/survey/${terminal.uniqueLink}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openQRDialog = (terminal: Terminal) => {
    setSelectedTerminal(terminal);
    setShowQRDialog(true);
  };

  const deleteTerminal = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este terminal?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/terminals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar terminal');
      }

      toast.success('Terminal deletado com sucesso!');
      fetchTerminals();
    } catch (error) {
      toast.error('Erro ao deletar terminal');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">💻</div>
          <p className="text-muted-foreground">Carregando terminais...</p>
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
                Visualizando terminais de <span className="font-bold">{viewingUserName}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Terminais
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os terminais conectados às suas campanhas
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={terminals.length >= maxTerminals ? 'destructive' : 'default'}>
              {terminals.length} / {maxTerminals} terminais
            </Badge>
            {terminals.length >= maxTerminals && (
              <span className="text-xs text-muted-foreground">
                Limite atingido
              </span>
            )}
          </div>
        </div>
        <Link href="/terminals/new">
          <Button size="lg" className="gap-2" disabled={terminals.length >= maxTerminals}>
            <Plus className="h-5 w-5" />
            Novo Terminal
          </Button>
        </Link>
      </div>

      {/* Lista de terminais */}
      {terminals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">💻</div>
            <h2 className="text-2xl font-bold mb-2">Nenhum terminal cadastrado</h2>
            <p className="text-muted-foreground mb-6">Crie seu primeiro terminal para começar</p>
            <Link href="/terminals/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeiro Terminal
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terminals.map((terminal) => (
            <Card key={terminal.id} className="hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-xl">{terminal.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={terminal.isActive ? 'default' : 'secondary'}>
                        {terminal.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                        {terminal.campaigns?.length || 0} campanha{(terminal.campaigns?.length || 0) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações */}
                <div className="space-y-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Email de Acesso</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{terminal.email}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${
                    terminal.isDefaultPassword 
                      ? 'bg-purple-50 dark:bg-purple-900/20' 
                      : 'bg-orange-50 dark:bg-orange-900/20'
                  }`}>
                    <p className="text-sm text-muted-foreground">
                      {terminal.isDefaultPassword ? 'Senha Padrão' : 'Senha Personalizada'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {terminal.isDefaultPassword ? 'term123' : '••••••••'}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Campanhas Vinculadas</p>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {terminal.campaigns?.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {terminal.campaigns.slice(0, 3).map((tc) => (
                            <li key={tc.id} className="truncate">
                              {tc.campaign.title}
                            </li>
                          ))}
                          {terminal.campaigns.length > 3 && (
                            <li className="text-muted-foreground">+{terminal.campaigns.length - 3} mais...</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">Nenhuma campanha</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <TooltipProvider>
                  <div className="flex flex-wrap gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => window.open(getTerminalUrl(terminal), '_blank')}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Visualizar</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(getTerminalUrl(terminal))}
                          className="h-8 w-8"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{copied ? 'Copiado!' : 'Copiar Link'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openQRDialog(terminal)}
                          className="h-8 w-8"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>QR Code</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/terminals/${terminal.id}/edit`}>
                          <Button size="icon" variant="outline" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => toggleStatus(terminal)}
                          disabled={togglingId === terminal.id}
                          className="h-8 w-8"
                        >
                          {terminal.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{terminal.isActive ? 'Desativar' : 'Ativar'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => deleteTerminal(terminal.id)}
                          disabled={deletingId === terminal.id}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog QR Code */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code do Terminal</DialogTitle>
            <DialogDescription>
              {selectedTerminal?.name} - {selectedTerminal?.campaigns?.length || 0} campanha(s) vinculada(s)
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {selectedTerminal && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <QRCodeSVG value={getTerminalUrl(selectedTerminal)} size={256} level="H" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Escaneie o QR Code ou compartilhe o link para coletar respostas
                </p>
                <div className="w-full space-y-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-center text-blue-900 dark:text-blue-100">
                    ℹ️ Link Único do Terminal
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    Todas as respostas através deste link serão automaticamente vinculadas a:
                  </p>
                  <div className="text-sm text-center">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {selectedTerminal.name}
                    </span>
                    {selectedTerminal.campaigns?.length > 0 && (
                      <>
                        {' → '}
                        <span className="text-muted-foreground">
                          {selectedTerminal.campaigns.map(tc => tc.campaign.title).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Button onClick={() => copyToClipboard(getTerminalUrl(selectedTerminal))} className="w-full">
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Link Copiado!' : 'Copiar Link'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
