'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ArrowLeft,
  Mail,
  Send,
  Users,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Monitor,
  Edit,
  Save,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailSend {
  id: string;
  status: string;
  sentAt?: string;
  contact: {
    email: string;
    name?: string;
  };
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  previewText?: string;
  bodyText: string;
  status: string;
  totalEmails: number;
  sentEmails: number;
  openedEmails: number;
  terminal: {
    id: string;
    name: string;
    uniqueLink?: string;
    campaign: { title: string; uniqueLink: string };
  };
  contactList?: {
    id: string;
    name: string;
    contacts: { id: string; email: string; name?: string }[];
  };
  emailSends: EmailSend[];
  sentAt?: string;
  createdAt: string;
}

interface ContactList {
  id: string;
  name: string;
  _count: { contacts: number };
}

interface UserData {
  emailCredits: number;
  logoUrl?: string;
  companyName?: string;
}

export default function EmailCampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    previewText: '',
    bodyText: '',
    contactListId: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCampaign();
      fetchContactLists();
      fetchUserData();
    }
  }, [status, router, id]);

  const fetchCampaign = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/email-campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
        setEditForm({
          name: data.name,
          subject: data.subject,
          previewText: data.previewText || '',
          bodyText: data.bodyText,
          contactListId: data.contactList?.id || '',
        });
      } else {
        toast.error('Campanha não encontrada');
        router.push('/email-campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactLists = async () => {
    try {
      const res = await fetch('/api/contact-lists');
      if (res.ok) {
        const data = await res.json();
        setContactLists(data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        setUserData({
          emailCredits: data.emailCredits || 0,
          logoUrl: data.logoUrl,
          companyName: data.companyName,
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/email-campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast.success('Campanha atualizada!');
        setEditing(false);
        fetchCampaign();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao atualizar');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/email-campaigns/${id}/send`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Campanha enviada! ${data.sent} emails enviados.`);
        setSendDialogOpen(false);
        fetchCampaign();
        fetchUserData();
      } else {
        toast.error(data.error || 'Erro ao enviar campanha');
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Erro ao enviar campanha');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (statusVal: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: React.ReactNode }> = {
      DRAFT: { label: 'Rascunho', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      SCHEDULED: { label: 'Agendada', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      SENDING: { label: 'Enviando', variant: 'default', icon: <Send className="h-3 w-3" /> },
      SENT: { label: 'Enviada', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      CANCELLED: { label: 'Cancelada', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[statusVal] || { label: statusVal, variant: 'secondary' as const, icon: null };

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getSendStatusBadge = (statusVal: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      SENT: 'bg-green-100 text-green-800',
      OPENED: 'bg-blue-100 text-blue-800',
      CLICKED: 'bg-purple-100 text-purple-800',
      RESPONDED: 'bg-emerald-100 text-emerald-800',
      BOUNCED: 'bg-orange-100 text-orange-800',
      FAILED: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      SENT: 'Enviado',
      OPENED: 'Aberto',
      CLICKED: 'Clicado',
      RESPONDED: 'Respondido',
      BOUNCED: 'Bounced',
      FAILED: 'Falhou',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[statusVal] || 'bg-gray-100 text-gray-800'}`}>
        {labels[statusVal] || statusVal}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        <Navbar />
        <main className="flex items-center justify-center flex-grow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        <Navbar />
        <main className="flex items-center justify-center flex-grow">
          <p className="text-muted-foreground">Campanha não encontrada</p>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedList = contactLists.find((l) => l.id === editForm.contactListId);
  const contactCount = campaign.contactList?.contacts.length || selectedList?._count.contacts || 0;
  const canSend = campaign.status === 'DRAFT' && campaign.contactList && contactCount > 0;
  const hasEnoughCredits = (userData?.emailCredits || 0) >= contactCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8 flex-grow space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/email-campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              {getStatusBadge(campaign.status)}
            </div>
            <p className="text-muted-foreground">Criada em {format(new Date(campaign.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'DRAFT' && !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {canSend && (
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => setSendDialogOpen(true)}
              disabled={!hasEnoughCredits}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Campanha
            </Button>
          )}
        </div>
      </div>

      {/* Credits Card */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Seus Créditos</p>
              <p className="text-2xl font-bold text-orange-600">
                {userData?.emailCredits?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          {campaign.status === 'DRAFT' && campaign.contactList && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Custo do envio</p>
              <p className={`text-xl font-bold ${hasEnoughCredits ? 'text-green-600' : 'text-red-600'}`}>
                {contactCount} créditos
              </p>
              {!hasEnoughCredits && (
                <p className="text-xs text-red-500">Créditos insuficientes</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Detalhes da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Assunto</Label>
                  <Input
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Lista de Contatos</Label>
                  <Select
                    value={editForm.contactListId}
                    onValueChange={(v) => setEditForm({ ...editForm, contactListId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name} ({list._count.contacts} contatos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Texto do Email</Label>
                  <Textarea
                    value={editForm.bodyText}
                    onChange={(e) => setEditForm({ ...editForm, bodyText: e.target.value })}
                    rows={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Assunto</p>
                  <p className="font-medium">{campaign.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Terminal / Pesquisa</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{campaign.terminal.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.terminal.campaign.title}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lista de Contatos</p>
                  {campaign.contactList ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{campaign.contactList.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.contactList.contacts.length} contatos
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma lista selecionada</p>
                  )}
                </div>
                {campaign.sentAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Enviada em</p>
                    <p className="font-medium">
                      {format(new Date(campaign.sentAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{campaign.totalEmails}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{campaign.sentEmails}</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{campaign.openedEmails}</p>
                <p className="text-sm text-muted-foreground">Abertos</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">
                  {campaign.sentEmails > 0
                    ? Math.round((campaign.openedEmails / campaign.sentEmails) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Taxa Abertura</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo do Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-line">
            {campaign.bodyText}
          </div>
        </CardContent>
      </Card>

      {/* Send History */}
      {campaign.emailSends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Envios ({campaign.emailSends.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Contato</th>
                    <th className="text-left p-2 text-sm font-medium">Email</th>
                    <th className="text-left p-2 text-sm font-medium">Status</th>
                    <th className="text-left p-2 text-sm font-medium">Enviado em</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.emailSends.map((send) => (
                    <tr key={send.id} className="border-b">
                      <td className="p-2">{send.contact.name || '-'}</td>
                      <td className="p-2 text-sm">{send.contact.email}</td>
                      <td className="p-2">{getSendStatusBadge(send.status)}</td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {send.sentAt
                          ? format(new Date(send.sentAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Confirmation Dialog */}
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a enviar a campanha <strong>{campaign.name}</strong> para{' '}
              <strong>{contactCount} contatos</strong>.
              <br /><br />
              Serão descontados <strong>{contactCount} créditos</strong> do seu saldo.
              <br />
              Saldo atual: <strong>{userData?.emailCredits?.toLocaleString()} créditos</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Confirmar Envio
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </main>
      <Footer />
    </div>
  );
}
