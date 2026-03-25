'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, Building2, User, Mail, Lock, MapPin, CreditCard, Calendar } from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  companyName?: string;
  responsiblePerson?: string;
  cnpj?: string;
  cep?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  planType?: string;
  maxTerminals?: number;
  lastAccess?: string;
  createdAt: string;
  _count?: {
    campaigns: number;
    terminals: number;
  };
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    isActive: true,
    companyName: '',
    responsiblePerson: '',
    cnpj: '',
    cep: '',
    address: '',
    addressNumber: '',
    addressComplement: '',
    neighborhood: '',
    city: '',
    state: '',
    planType: '',
    maxTerminals: 1,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (status === 'authenticated' && params.userId) {
      fetchUserData();
    }
  }, [status, session, router, params.userId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${params.userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          password: '',
          role: data.role || 'USER',
          isActive: data.isActive ?? true,
          companyName: data.companyName || '',
          responsiblePerson: data.responsiblePerson || '',
          cnpj: data.cnpj || '',
          maxTerminals: data.maxTerminals || 1,
          cep: data.cep || '',
          address: data.address || '',
          addressNumber: data.addressNumber || '',
          addressComplement: data.addressComplement || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          planType: data.planType || '',
        });
      } else {
        toast.error('Erro ao carregar dados do usuário');
        router.push('/admin/users');
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do usuário');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleCepSearch = async () => {
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error('CEP inválido');
      return;
    }

    setSearchingCep(true);
    try {
      const response = await fetch(`/api/cep?cep=${cleanCep}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          address: data.address || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
        }));
        toast.success('Endereço encontrado!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setSearchingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/users/${params.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Usuário atualizado com sucesso!');
        router.push('/admin/users');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl flex-grow">
        {/* Cabeçalho */}
        <div className="mb-6">
          <Link href="/admin/users">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Usuários
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Editar Usuário/Empresa</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gerencie os dados do cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card de Status */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <User className="h-5 w-5" />
                Status da Conta
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Controle o acesso do cliente à plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                <div className="space-y-0.5">
                  <Label className="text-base dark:text-gray-100">Conta Ativa</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.isActive
                      ? 'Cliente com acesso liberado'
                      : 'Cliente sem acesso (inadimplente/desistente)'}
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>

              {userData.lastAccess && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Último acesso:{' '}
                    {new Date(userData.lastAccess).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {!userData.lastAccess && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Nunca acessou a plataforma</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Dados Básicos */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <User className="h-5 w-5" />
                Dados Básicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="dark:text-gray-300">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-gray-300">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="dark:text-gray-300">
                    Nova Senha (deixe em branco para manter a atual)
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="dark:text-gray-300">Função *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Usuário</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Dados da Empresa */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Building2 className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="dark:text-gray-300">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsiblePerson" className="dark:text-gray-300">Responsável</Label>
                  <Input
                    id="responsiblePerson"
                    value={formData.responsiblePerson}
                    onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="dark:text-gray-300">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planType" className="dark:text-gray-300">Tipo de Plano</Label>
                  <Select
                    value={formData.planType}
                    onValueChange={(value) => setFormData({ ...formData, planType: value })}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MENSAL">Mensal</SelectItem>
                      <SelectItem value="ANUAL">Anual</SelectItem>
                      <SelectItem value="LIVRE">Livre</SelectItem>
                      <SelectItem value="TESTE_7_DIAS">Teste 7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTerminals" className="dark:text-gray-300">
                    Quantidade de Terminais Permitidos
                  </Label>
                  <Input
                    id="maxTerminals"
                    type="number"
                    min="1"
                    value={formData.maxTerminals}
                    onChange={(e) => setFormData({ ...formData, maxTerminals: parseInt(e.target.value) || 1 })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                  {userData?._count?.terminals !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      Atualmente possui {userData._count.terminals} terminal(is) cadastrado(s)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Endereço */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <MapPin className="h-5 w-5" />
                Endereço Completo
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Preencha o CEP para buscar o endereço automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cep" className="dark:text-gray-300">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: formatCep(e.target.value) })}
                      placeholder="00000-000"
                      maxLength={9}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    <Button
                      type="button"
                      onClick={handleCepSearch}
                      disabled={searchingCep}
                      variant="outline"
                    >
                      {searchingCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="dark:text-gray-300">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressNumber" className="dark:text-gray-300">Número</Label>
                  <Input
                    id="addressNumber"
                    value={formData.addressNumber}
                    onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressComplement" className="dark:text-gray-300">Complemento</Label>
                  <Input
                    id="addressComplement"
                    value={formData.addressComplement}
                    onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood" className="dark:text-gray-300">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="dark:text-gray-300">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="dark:text-gray-300">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={2}
                    placeholder="SP"
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/users">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
