'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Shield, User, Loader2, Edit, Trash2, Building2, Calendar, CheckCircle, XCircle, LogIn, KeyRound, Activity, AlertTriangle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ViewUserCredentialsDialog } from './view-user-credentials-dialog';

interface User {
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
  lastAccess?: string;
  createdAt: string;
  _count: { campaigns: number };
}

export function UsersContent() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data ?? []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar usuário');
        return;
      }

      toast.success('Usuário criado com sucesso!');
      setShowDialog(false);
      setFormData({ name: '', email: '', password: '', role: 'USER' });
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao criar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar status');
        return;
      }

      toast.success(!currentStatus ? 'Usuário ativado!' : 'Usuário desativado!');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingId(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar usuário');
        return;
      }

      toast.success('Usuário deletado com sucesso!');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao deletar usuário');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewCredentials = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setCredentialsDialogOpen(true);
  };

  const handleViewLogs = (userId: string) => {
    router.push(`/admin/users/${userId}/activity-logs`);
  };

  const handleImpersonate = async (userId: string, userName: string) => {
    if (!confirm(`Deseja visualizar os dados de ${userName}? Você será redirecionado para uma visualização filtrada dos dados deste usuário.`)) {
      return;
    }

    setImpersonatingId(userId);
    try {
      const response = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Erro ao acessar visualização do usuário');
        return;
      }

      const data = await response.json();
      
      toast.success(`Visualizando dados de ${userName}...`);
      
      // Redirecionar para o dashboard com parâmetro de visualização
      router.push(`/dashboard?viewAsUser=${userId}`);
    } catch (error) {
      toast.error('Erro ao acessar visualização do usuário');
    } finally {
      setImpersonatingId(null);
    }
  };

  const getPlanBadgeColor = (planType?: string) => {
    switch (planType) {
      case 'ANUAL':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'MENSAL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'TESTE_7_DIAS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LIVRE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPlanLabel = (planType?: string) => {
    switch (planType) {
      case 'ANUAL':
        return 'Anual';
      case 'MENSAL':
        return 'Mensal';
      case 'TESTE_7_DIAS':
        return 'Teste 7 dias';
      case 'LIVRE':
        return 'Livre';
      default:
        return 'Não definido';
    }
  };

  const checkExpiration = (user: User) => {
    if (!user.expiresAt || user.planType === 'LIVRE') {
      return { status: 'ok', daysLeft: null };
    }

    const now = new Date();
    const expiryDate = new Date(user.expiresAt);
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: 'expired', daysLeft };
    } else if (daysLeft <= 7) {
      return { status: 'expiring_soon', daysLeft };
    } else {
      return { status: 'ok', daysLeft };
    }
  };

  const getExpiringUsers = () => {
    return users
      .filter((user) => {
        const expiration = checkExpiration(user);
        return expiration.status === 'expired' || expiration.status === 'expiring_soon';
      })
      .sort((a, b) => {
        const expirationA = checkExpiration(a);
        const expirationB = checkExpiration(b);
        return (expirationA.daysLeft ?? 0) - (expirationB.daysLeft ?? 0);
      });
  };

  const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return 'Não definido';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground dark:text-gray-400">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  const expiringUsers = getExpiringUsers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gerenciamento de Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Controle completo dos seus clientes e empresas
          </p>
        </div>
        <Button size="lg" onClick={() => setShowDialog(true)} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Novo Cliente
        </Button>
      </div>

      {/* Notificação de Vencimento */}
      {expiringUsers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-1" />
              <div className="flex-1">
                <CardTitle className="text-lg text-orange-900 dark:text-orange-200">
                  {expiringUsers.length === 1
                    ? 'Atenção: 1 cliente com plano próximo do vencimento'
                    : `Atenção: ${expiringUsers.length} clientes com planos próximos do vencimento`}
                </CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300 mt-1">
                  Os seguintes clientes precisam de atenção:
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringUsers.map((user) => {
                const expiration = checkExpiration(user);
                const isExpired = expiration.status === 'expired';
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isExpired
                        ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className={`h-5 w-5 ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                      <div>
                        <p className={`font-medium ${isExpired ? 'text-red-900 dark:text-red-200' : 'text-yellow-900 dark:text-yellow-200'}`}>
                          {user.name} {user.companyName && `- ${user.companyName}`}
                        </p>
                        <p className={`text-sm ${isExpired ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                          {isExpired
                            ? `Plano vencido há ${Math.abs(expiration.daysLeft!)} dias`
                            : `Plano vence em ${expiration.daysLeft} ${expiration.daysLeft === 1 ? 'dia' : 'dias'}`}
                          {' '}• Vencimento: {formatExpirationDate(user.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                      className={isExpired ? 'border-red-400 dark:border-red-600' : 'border-yellow-400 dark:border-yellow-600'}
                    >
                      Editar Plano
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Usuários */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Lista de Clientes</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {users.length} {users.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Status</TableHead>
                  <TableHead className="dark:text-gray-300">Cliente</TableHead>
                  <TableHead className="dark:text-gray-300">Empresa</TableHead>
                  <TableHead className="dark:text-gray-300">Plano</TableHead>
                  <TableHead className="dark:text-gray-300">Vencimento</TableHead>
                  <TableHead className="dark:text-gray-300">Último Acesso</TableHead>
                  <TableHead className="dark:text-gray-300">Campanhas</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="dark:border-gray-700 dark:hover:bg-gray-750">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => handleToggleActive(user.id, user.isActive)}
                          disabled={togglingId === user.id}
                        />
                        {user.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </span>
                        {user.role === 'ADMIN' && (
                          <Badge variant="default" className="w-fit mt-1">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.companyName ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {user.companyName}
                          </span>
                          {user.responsiblePerson && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {user.responsiblePerson}
                            </span>
                          )}
                          {user.cnpj && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              CNPJ: {user.cnpj}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          Não informado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanBadgeColor(user.planType)}>
                        {getPlanLabel(user.planType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.planType === 'LIVRE' ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Sem vencimento
                        </span>
                      ) : user.expiresAt ? (
                        <div className="flex flex-col text-sm">
                          <span className={`font-medium ${
                            checkExpiration(user).status === 'expired'
                              ? 'text-red-600 dark:text-red-400'
                              : checkExpiration(user).status === 'expiring_soon'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {formatExpirationDate(user.expiresAt)}
                          </span>
                          {checkExpiration(user).status !== 'ok' && (
                            <span className={`text-xs ${
                              checkExpiration(user).status === 'expired'
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-yellow-500 dark:text-yellow-400'
                            }`}>
                              {checkExpiration(user).status === 'expired'
                                ? `Vencido há ${Math.abs(checkExpiration(user).daysLeft!)} dias`
                                : `${checkExpiration(user).daysLeft} dias restantes`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Não definido
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.lastAccess ? (
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-900 dark:text-gray-100">
                            {new Date(user.lastAccess).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(user.lastAccess).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          Nunca acessou
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                        {user._count?.campaigns ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/users/${user.id}/stats`)}
                          title="Ver estatísticas"
                          className="text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-950"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                          title="Editar usuário"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCredentials(user.id, user.name)}
                          title="Ver credenciais"
                          className="text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewLogs(user.id)}
                          title="Ver logs de atividade"
                          className="text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                        {user.role !== 'ADMIN' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleImpersonate(user.id, user.name)}
                            disabled={impersonatingId === user.id}
                            className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                            title="Acessar como usuário"
                          >
                            {impersonatingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LogIn className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                          title="Deletar usuário"
                        >
                          {deletingId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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

      {/* Dialog Novo Usuário */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>Adicione um novo usuário ao sistema</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={submitting}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuário *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'ADMIN' | 'USER') => setFormData({ ...formData, role: value })}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Usuário Regular
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administrador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={submitting} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Credenciais */}
      {selectedUser && (
        <ViewUserCredentialsDialog
          open={credentialsDialogOpen}
          onOpenChange={setCredentialsDialogOpen}
          userId={selectedUser.id}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
}
