'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Plus,
  Mail,
  Send,
  Eye,
  Trash2,
  Users,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Monitor,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalEmails: number;
  sentEmails: number;
  openedEmails: number;
  terminal: {
    id: string;
    name: string;
    campaign: { title: string };
  };
  contactList?: {
    id: string;
    name: string;
    _count: { contacts: number };
  };
  sentAt?: string;
  createdAt: string;
}

interface UserCredits {
  emailCredits: number;
}

export function EmailCampaignsContent() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<EmailCampaign | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCampaigns();
      fetchUserCredits();
    }
  }, [status, router]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        setUserCredits({ emailCredits: data.emailCredits || 0 });
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingCampaign) return;

    try {
      const res = await fetch(`/api/email-campaigns/${deletingCampaign.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Campanha excluída!');
        setDeleteDialogOpen(false);
        setDeletingCampaign(null);
        fetchCampaigns();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao excluir campanha');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      DRAFT: { label: 'Rascunho', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      SCHEDULED: { label: 'Agendada', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
      SENDING: { label: 'Enviando', variant: 'default', icon: <Send className="h-3 w-3" /> },
      SENT: { label: 'Enviada', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      CANCELLED: { label: 'Cancelada', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' as const, icon: null };

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Campanhas de Email
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie pesquisas por email para suas listas de contatos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
            <CardContent className="p-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Créditos</p>
                <p className="font-bold text-orange-600">
                  {userCredits?.emailCredits?.toLocaleString() || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Link href="/email-campaigns/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Campanhas</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enviadas</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter((c) => c.status === 'SENT').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emails Enviados</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + c.sentEmails, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rascunhos</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter((c) => c.status === 'DRAFT').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Nenhuma campanha criada ainda</p>
              <Link href="/email-campaigns/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Campanha
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Terminal / Pesquisa</TableHead>
                    <TableHead>Lista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Enviados</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {campaign.subject}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.terminal ? (
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{campaign.terminal.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {campaign.terminal.campaign?.title || '-'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.contactList ? (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{campaign.contactList.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {campaign.contactList._count.contacts} contatos
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{campaign.sentEmails}</span>
                        <span className="text-muted-foreground">/{campaign.totalEmails}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {format(new Date(campaign.sentAt || campaign.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(campaign.sentAt || campaign.createdAt), 'HH:mm', { locale: ptBR })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/email-campaigns/${campaign.id}`}>
                            <Button size="icon" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => {
                              setDeletingCampaign(campaign);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={campaign.status === 'SENDING'}
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
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a campanha{' '}
              <strong>{deletingCampaign?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
