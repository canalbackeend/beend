'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  Monitor,
  Users,
  CreditCard,
  Send,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface Terminal {
  id: string;
  name: string;
  campaign: { title: string; uniqueLink: string };
  uniqueLink?: string;
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

export function NewEmailCampaignForm() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    name: '',
    subject: '',
    previewText: '',
    bodyText: '',
    terminalId: '',
    contactListId: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [terminalsRes, listsRes, userRes] = await Promise.all([
        fetch('/api/terminals'),
        fetch('/api/contact-lists'),
        fetch('/api/users/profile'),
      ]);

      if (terminalsRes.ok) {
        const data = await terminalsRes.json();
        setTerminals(data);
      }
      if (listsRes.ok) {
        const data = await listsRes.json();
        setContactLists(data);
      }
      if (userRes.ok) {
        const data = await userRes.json();
        setUserData({
          emailCredits: data.emailCredits || 0,
          logoUrl: data.logoUrl,
          companyName: data.companyName,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.subject || !form.bodyText || !form.terminalId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const campaign = await res.json();
        toast.success('Campanha criada com sucesso!');
        router.push(`/email-campaigns/${campaign.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao criar campanha');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Erro ao criar campanha');
    } finally {
      setSaving(false);
    }
  };

  const selectedList = contactLists.find((l) => l.id === form.contactListId);
  const selectedTerminal = terminals.find((t) => t.id === form.terminalId);
  const contactCount = selectedList?._count.contacts || 0;
  const hasEnoughCredits = (userData?.emailCredits || 0) >= contactCount;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-8 flex-grow space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/email-campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nova Campanha de Email</h1>
          <p className="text-muted-foreground">Configure e envie emails para sua lista de contatos</p>
        </div>
      </div>

      {/* Credits Info */}
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
          {form.contactListId && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Custo desta campanha</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Informações da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome da Campanha *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Pesquisa Janeiro 2026"
              />
              <p className="text-xs text-muted-foreground mt-1">Apenas para sua organização interna</p>
            </div>
            <div>
              <Label>Assunto do Email *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Ex: Queremos ouvir sua opinião!"
              />
            </div>
            <div>
              <Label>Texto de Preview</Label>
              <Input
                value={form.previewText}
                onChange={(e) => setForm({ ...form, previewText: e.target.value })}
                placeholder="Texto que aparece na prévia do email (opcional)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Terminal & List Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Terminal / Pesquisa *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={form.terminalId}
                onValueChange={(v) => setForm({ ...form, terminalId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o terminal" />
                </SelectTrigger>
                <SelectContent>
                  {terminals.map((terminal) => (
                    <SelectItem key={terminal.id} value={terminal.id}>
                      <div className="flex flex-col">
                        <span>{terminal.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {terminal.campaign.title}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {terminals.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Você precisa criar um terminal primeiro.
                  <Link href="/terminals/new" className="text-primary ml-1">
                    Criar terminal
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Contatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={form.contactListId}
                onValueChange={(v) => setForm({ ...form, contactListId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma lista" />
                </SelectTrigger>
                <SelectContent>
                  {contactLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{list.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {list._count.contacts} contatos
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contactLists.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Você precisa criar uma lista de contatos primeiro.
                  <Link href="/contacts" className="text-primary ml-1">
                    Gerenciar contatos
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Email Content */}
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo do Email *</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.bodyText}
              onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
              placeholder="Digite o texto do email...\n\nO email incluirá automaticamente:\n- Seu logo\n- Botão para participar da pesquisa\n- Dados da sua empresa"
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              O email será enviado com seu logo, o texto acima e um botão para acessar a pesquisa.
            </p>
          </CardContent>
        </Card>

        {/* Preview Button */}
        {form.bodyText && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Ocultar Preview' : 'Ver Preview do Email'}
          </Button>
        )}

        {/* Email Preview */}
        {showPreview && form.bodyText && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-6">
              <div className="flex justify-center">
                {userData?.logoUrl ? (
                  <img src={userData.logoUrl} alt="Logo" className="max-h-16 object-contain" />
                ) : (
                  <div className="text-2xl font-bold">{userData?.companyName || 'Sua Empresa'}</div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">{form.subject || 'Assunto do Email'}</h2>
              <p className="text-muted-foreground">Olá, [Nome do Contato]!</p>
              <div className="whitespace-pre-line">{form.bodyText}</div>
              <div className="text-center py-4">
                <Button className="bg-orange-500 hover:bg-orange-600 px-8">
                  Participar da Pesquisa
                </Button>
              </div>
              <div className="border-t pt-4 text-center text-xs text-muted-foreground">
                <p>{userData?.companyName || 'Sua Empresa'} | Pesquisa de Satisfação</p>
                <p>Enviado via Beend</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/email-campaigns" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            disabled={saving || !form.terminalId}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Criar Campanha
              </span>
            )}
          </Button>
        </div>
      </form>
      </main>
      <Footer />
    </div>
  );
}
