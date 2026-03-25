'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function ActivityLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/activity-logs?limit=100');
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
            <Link href="/profile">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Histórico de Atividades
            </h1>
            <p className="text-muted-foreground mt-2">
              Registro completo de todas as ações realizadas
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
          <h1 className="text-3xl font-bold">Histórico de Atividades</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          <p className="text-sm text-muted-foreground">
            Total de registros: {total}
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ActivityIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Nenhuma atividade registrada</h2>
            <p className="text-muted-foreground">As ações realizadas aparecerão aqui</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Estatísticas - Ocultar na impressão */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Registros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Última Atividade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">
                  {logs[0] && format(new Date(logs[0].createdAt), 'dd/MM/yyyy HH:mm')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">
                  {logs.length > 0 && logs[logs.length - 1] && (
                    `${format(new Date(logs[logs.length - 1].createdAt), 'dd/MM')} - ${format(new Date(logs[0].createdAt), 'dd/MM')}`
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline de Atividades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Registro de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log, index) => {
                  const actionInfo = actionLabels[log.action] || { label: log.action, color: 'bg-gray-500' };
                  
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0 print:break-inside-avoid"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${actionInfo.color} print:bg-black`} />
                        {index < logs.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="print:border-black">
                            {actionInfo.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm">{log.description}</p>
                        {log.entityName && (
                          <p className="text-xs text-muted-foreground">
                            {log.entityType}: {log.entityName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
