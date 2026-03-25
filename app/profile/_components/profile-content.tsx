'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, User, Mail, Shield, Calendar, Lock, Eye as EyeIcon, EyeOff, Building2, CreditCard, MapPin, FileText, Activity, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { LogoUpload } from './logo-upload';
import { CopyCredentials } from './copy-credentials';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  companyName?: string;
  responsiblePerson?: string;
  cnpj?: string;
  planType?: string;
  cep?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  logoUrl?: string | null;
}

export default function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewAsUserId = searchParams?.get('viewAsUser');
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router, viewAsUserId]);

  const fetchProfile = async () => {
    try {
      const url = viewAsUserId ? `/api/users/profile?viewAsUser=${viewAsUserId}` : '/api/users/profile';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        toast.error('Erro ao carregar perfil');
      }
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Senha atualizada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar senha');
      }
    } catch (error) {
      toast.error('Erro ao atualizar senha');
    } finally {
      setUpdating(false);
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

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground dark:text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de visualização como outro usuário */}
      {viewAsUserId && profile && (
        <Card className="border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Visualizando perfil de <span className="font-bold">{profile.name}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de Informações do Usuário */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <User className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Seus dados cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome
                </Label>
                <Input value={profile.name} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input value={profile.email} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Função
                </Label>
                <Input value={profile.role === 'ADMIN' ? 'Administrador' : 'Usuário'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Membro desde
                </Label>
                <Input value={new Date(profile.createdAt).toLocaleDateString('pt-BR')} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
              </div>
            </div>
          </div>

          {/* Informações da Empresa */}
          {profile.role !== 'ADMIN' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Informações da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Nome da Empresa
                  </Label>
                  <Input value={profile.companyName || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Responsável
                  </Label>
                  <Input value={profile.responsiblePerson || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CNPJ
                  </Label>
                  <Input value={profile.cnpj || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Plano
                  </Label>
                  <Input value={getPlanLabel(profile.planType)} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
              </div>
            </div>
          )}

          {/* Endereço */}
          {profile.role !== 'ADMIN' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    CEP
                  </Label>
                  <Input value={profile.cep || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</Label>
                  <Input value={profile.address || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Número</Label>
                  <Input value={profile.addressNumber || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Complemento</Label>
                  <Input value={profile.addressComplement || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bairro</Label>
                  <Input value={profile.neighborhood || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cidade</Label>
                  <Input value={profile.city || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</Label>
                  <Input value={profile.state || 'Não informado'} disabled className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logo da Empresa */}
      <LogoUpload currentLogoUrl={profile.logoUrl} onLogoUpdate={(url) => setProfile(prev => prev ? {...prev, logoUrl: url} : null)} />

      {/* Credenciais de Acesso */}
      {profile.role !== 'ADMIN' && <CopyCredentials userName={profile.name} userEmail={profile.email} />}

      {/* Alterar Senha */}
      {!viewAsUserId && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <Lock className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Atualize sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="dark:text-gray-300">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pr-10 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="dark:text-gray-300">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="dark:text-gray-300">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={updating} className="w-full">
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Senha'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Palavras-Chave de Sentimento */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            Análise de Sentimento
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Personalize palavras-chave para análise de sentimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/profile/sentiment-keywords">
            <Button variant="outline" className="w-full">
              Gerenciar Palavras-Chave
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Logs de Atividade */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <Activity className="h-5 w-5" />
            Logs de Atividade
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Histórico de ações realizadas na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/profile/activity-logs">
            <Button variant="outline" className="w-full">
              Ver Histórico Completo
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
