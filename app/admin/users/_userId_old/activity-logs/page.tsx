'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, FileText, Calendar, Activity as ActivityIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  description: string;
  createdAt: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  CREATE_CAMPAIGN: { label: 'Criou Campanha', color: 'bg-green-500' },
  UPDATE_CAMPAIGN: { label: 'Editou Campanha', color: 'bg-blue-500' },
  DELETE_CAMPAIGN: { label: 'Deletou Campanha', color: 'bg-red-500' },
  CREATE_TERMINAL: { label: 'Criou Terminal', color: 'bg-green-500' },
  UPDATE_TERMINAL: { label: 'Editou Terminal', color: 'bg-blue-500' },
  DELETE_TERMINAL: { label: 'Deletou Terminal', color: 'bg-red-500' },
  UPDATE_PROFILE: { label: 'Atualizou Perfil', color: 'bg-purple-500' },
  UPLOAD_LOGO: { label: 'Atualizou Logo', color: 'bg-indigo-500' },
  RESET_CAMPAIGN_DATA: { label: 'Resetou Dados', color: 'bg-orange-500' },
};

export default function UserActivityLogsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const userId = params.userId as string;
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    // @ts-ignore
    if (session.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (userId) {
      fetchUserData();
      fetchLogs();
    }
  }, [session, userId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/credentials`);
      if (response.ok) {
        const data = await response.json();
        setUserName(data.user.name);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/activity-logs?userId=${userId}&limit=100`);
      const data = await response.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-lg">Carregando histórico...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header - Ocultar na impressão */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Histórico de Atividades
            </h1>
            <p className="text-muted-foreground mt-2">
              {userName ? `Usuário: ${userName}` : 'Registro completo de todas as ações realizadas'}
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} size="lg" className="gap-2">
          <Printer className="h-5 w-5" />
          Imprimir
        </Button>
      </div>

      {/* Header para impressão */}
      <div className="hidden print:block mb-8">
        <div className="text-center border-b-2 border-border pb-4">
          <h1 className="text-3xl font-bold mb-2">Histórico de Atividades</h1>
          <p className="text-muted-foreground">{userName && `Usuário: ${userName}`}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Gerado em: {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:break-inside-avoid">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total de Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Primeira Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {logs.length > 0 ? format(new Date(logs[logs.length - 1].createdAt), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Última Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {logs.length > 0 ? format(new Date(logs[0].createdAt), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de Atividades */}
      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Linha do Tempo
          </CardTitle>
          <CardDescription>
            Registro detalhado de todas as ações realizadas pelo usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const actionInfo = actionLabels[log.action] || { label: log.action, color: 'bg-gray-500' };
                return (
                  <div key={log.id} className="flex gap-4 print:break-inside-avoid">
                    {/* Timeline vertical */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${actionInfo.color}`} />
                      {index < logs.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2 print:bg-gray-300" />
                      )}
                    </div>

                    {/* Conteúdo do log */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${actionInfo.color} text-white print:border print:border-black`}>
                            {actionInfo.label}
                          </Badge>
                          {log.entityName && (
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {log.entityName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
