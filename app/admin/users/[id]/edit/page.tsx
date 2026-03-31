'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Save,
  User,
  Building2,
  CreditCard,
  Monitor,
  Calendar,
  Mail,
  Plus,
  Minus,
  History,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  companyName?: string;
  responsiblePerson?: string;
  cnpj?: string;
  planType?: string;
  expiresAt?: string;
  maxTerminals: number;
  emailCredits: number;
  dailyEmailLimit: number;
  createdAt: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  balance: number;
  type: string;
  description?: string;
  createdAt: string;
}

export default function EditUserPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    companyName: '',
    responsiblePerson: '',
    cnpj: '',
    planType: '',
    expiresAt: '',
    maxTerminals: 1,
    emailCredits: 0,
    dailyEmailLimit: 100,
    isActive: true,
    role: 'USER' as 'ADMIN' | 'USER',
  });

  const [creditAdjustment, setCreditAdjustment] = useState({
    amount: 0,
    description: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Check if admin
      if ((session as { user?: { role?: string } })?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      fetchUser();
      fetchTransactions();
    }
  }, [status, router, id, session]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          companyName: data.companyName || '',
          responsiblePerson: data.responsiblePerson || '',
          cnpj: data.cnpj || '',
          planType: data.planType || '',
          expiresAt: data.expiresAt ? data.expiresAt.split('T')[0] : '',
          maxTerminals: data.maxTerminals || 1,
          emailCredits: data.emailCredits || 0,
          dailyEmailLimit: data.dailyEmailLimit || 100,
          isActive: data.isActive ?? true,
          role: data.role || 'USER',
        });
      } else {
        toast.error('Usuário não encontrado');
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Erro ao carregar usuário');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}/credit-transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success('Usuário atualizado com sucesso!');
        fetchUser();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao atualizar');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleCreditAdjustment = async (type: 'add' | 'remove') => {
    if (creditAdjustment.amount <= 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: type === 'add' ? creditAdjustment.amount : -creditAdjustment.amount,
          description: creditAdjustment.description || (type === 'add' ? 'Créditos adicionados pelo admin' : 'Créditos removidos pelo admin'),
        }),
      });

      if (res.ok) {
        toast.success(type === 'add' ? 'Créditos adicionados!' : 'Créditos removidos!');
        setCreditAdjustment({ amount: 0, description: '' });
        fetchUser();
        fetchTransactions();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao ajustar créditos');
      }
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast.error('Erro ao ajustar créditos');
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PURCHASE: 'Compra',
      ADMIN_CREDIT: 'Crédito Admin',
      ADMIN_DEBIT: 'Débito Admin',
      EMAIL_SENT: 'Envio de Email',
    };
    return labels[type] || type;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8 flex-grow space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Editar Usuário</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Função</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as 'ADMIN' | 'USER' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Usuário</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label>Ativo</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome da Empresa</Label>
                <Input
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
              <div>
                <Label>Responsável</Label>
                <Input
                  value={form.responsiblePerson}
                  onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Plan & Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Plano e Limites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Plano</Label>
                <Select
                  value={form.planType}
                  onValueChange={(v) => setForm({ ...form, planType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TESTE_7_DIAS">Teste 7 Dias</SelectItem>
                    <SelectItem value="MENSAL">Mensal</SelectItem>
                    <SelectItem value="ANUAL">Anual</SelectItem>
                    <SelectItem value="LIVRE">Livre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Expiração</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Máximo de Terminais
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={form.maxTerminals}
                  onChange={(e) => setForm({ ...form, maxTerminals: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Limite Diário de Emails
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={form.dailyEmailLimit}
                  onChange={(e) => setForm({ ...form, dailyEmailLimit: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Salvando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </span>
          )}
        </Button>
      </form>

      {/* Email Credits Management */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Créditos de Email
          </CardTitle>
          <CardDescription>
            Gerencie os créditos de email marketing deste usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Balance */}
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <p className="text-4xl font-bold text-orange-600">
              {form.emailCredits.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">créditos</p>
          </div>

          {/* Adjustment Form */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={creditAdjustment.amount || ''}
                  onChange={(e) => setCreditAdjustment({
                    ...creditAdjustment,
                    amount: parseInt(e.target.value) || 0
                  })}
                  placeholder="Ex: 100"
                />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Input
                  value={creditAdjustment.description}
                  onChange={(e) => setCreditAdjustment({
                    ...creditAdjustment,
                    description: e.target.value
                  })}
                  placeholder="Motivo do ajuste"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleCreditAdjustment('add')}
                disabled={creditAdjustment.amount <= 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Créditos
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={() => handleCreditAdjustment('remove')}
                disabled={creditAdjustment.amount <= 0 || creditAdjustment.amount > form.emailCredits}
              >
                <Minus className="h-4 w-4 mr-2" />
                Remover Créditos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Data</th>
                    <th className="text-left p-2 text-sm font-medium">Tipo</th>
                    <th className="text-right p-2 text-sm font-medium">Valor</th>
                    <th className="text-right p-2 text-sm font-medium">Saldo</th>
                    <th className="text-left p-2 text-sm font-medium">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b">
                      <td className="p-2 text-sm">
                        {format(new Date(tx.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="p-2 text-sm">{getTransactionTypeLabel(tx.type)}</td>
                      <td className={`p-2 text-sm text-right font-medium ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </td>
                      <td className="p-2 text-sm text-right">{tx.balance}</td>
                      <td className="p-2 text-sm text-muted-foreground truncate max-w-[200px]">
                        {tx.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      </main>
      <Footer />
    </div>
  );
}
