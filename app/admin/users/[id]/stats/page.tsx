'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Monitor, Calendar, Clock, TrendingUp, Users, BarChart3, 
  Activity, CheckCircle, AlertCircle, XCircle, Globe, Smartphone,
  Building2, Mail, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

interface TerminalStat {
  id: string;
  name: string;
  email: string;
  lastAccess: string | null;
  createdAt: string;
  responseCount: number;
  campaign: { id: string; title: string } | null;
}

interface CampaignStat {
  id: string;
  title: string;
  responseCount: number;
}

interface StatsData {
  user: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
    isActive: boolean;
    maxTerminals: number;
    createdAt: string;
    lastAccess: string | null;
  };
  terminals: TerminalStat[];
  responses: {
    last7Days: number;
    last15Days: number;
    last30Days: number;
    last90Days: number;
    byWebview: number;
    byTerminal: number;
  };
  lastAccess: {
    webview: string | null;
    terminal: string | null;
    platform: string | null;
  };
  activityStatus: 'active' | 'moderate' | 'inactive';
  isActiveRecently: boolean;
  charts: {
    daily: { date: string; count: number }[];
    hourly: { hour: number; count: number }[];
  };
  campaigns: CampaignStat[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function UserStatsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/stats`);
      if (!response.ok) throw new Error('Erro ao carregar');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-600"><AlertCircle className="h-3 w-3 mr-1" />Moderado</Badge>;
      default:
        return <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" />Inativo</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Usuário não encontrado</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const totalResponses90 = data.responses.last90Days;
  const pieData = [
    { name: 'WebView', value: data.responses.byWebview, color: '#3b82f6' },
    { name: 'Terminal', value: data.responses.byTerminal, color: '#10b981' },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8 flex-grow space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Estatísticas do Usuário
            </h1>
            <p className="text-muted-foreground">{data.user.name} - {data.user.email}</p>
          </div>
        </div>
        {getStatusBadge(data.activityStatus)}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Monitor className="h-4 w-4" /> Terminais
            </div>
            <p className="text-2xl font-bold mt-1">
              {data.terminals.length} / {data.user.maxTerminals}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" /> Respostas (90d)
            </div>
            <p className="text-2xl font-bold mt-1">{totalResponses90}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Building2 className="h-4 w-4" /> Empresa
            </div>
            <p className="text-lg font-semibold mt-1 truncate">
              {data.user.companyName || '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" /> Cliente desde
            </div>
            <p className="text-lg font-semibold mt-1">
              {new Date(data.user.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Respostas por Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Pesquisas Realizadas por Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600">{data.responses.last7Days}</p>
              <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-600">{data.responses.last15Days}</p>
              <p className="text-sm text-muted-foreground">Últimos 15 dias</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-center">
              <p className="text-3xl font-bold text-yellow-600">{data.responses.last30Days}</p>
              <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-600">{data.responses.last90Days}</p>
              <p className="text-sm text-muted-foreground">Últimos 90 dias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Últimos Acessos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Últimos Acessos por Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span className="font-medium">WebView (Link)</span>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(data.lastAccess.webview)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                <span className="font-medium">Terminal (Totem)</span>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(data.lastAccess.terminal)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Painel Admin</span>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(data.lastAccess.platform)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="terminals">Terminais</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
        </TabsList>

        {/* Evolução Diária */}
        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Respostas (Últimos 30 dias)</CardTitle>
              <CardDescription>Número de pesquisas realizadas por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.charts.daily}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatShortDate}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip 
                      labelFormatter={(label) => formatShortDate(String(label))}
                      formatter={(value: number) => [`${value}`, 'Respostas']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {pieData.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-4 text-center">Distribuição por Origem (90 dias)</h4>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terminais */}
        <TabsContent value="terminals">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes dos Terminais</CardTitle>
              <CardDescription>Último acesso e respostas por terminal</CardDescription>
            </CardHeader>
            <CardContent>
              {data.terminals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum terminal cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Terminal</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead className="text-right">Respostas (90d)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.terminals.map((terminal) => (
                      <TableRow key={terminal.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-blue-600" />
                            {terminal.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {terminal.email}
                        </TableCell>
                        <TableCell>{terminal.campaign?.title ?? '-'}</TableCell>
                        <TableCell>
                          {terminal.lastAccess ? (
                            <span className="text-sm">{formatDate(terminal.lastAccess)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{terminal.responseCount}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campanhas */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Respostas por Campanha</CardTitle>
              <CardDescription>Distribuição de respostas nos últimos 90 dias</CardDescription>
            </CardHeader>
            <CardContent>
              {data.campaigns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma campanha cadastrada</p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.campaigns} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="title" 
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar dataKey="responseCount" name="Respostas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Horários de Pico */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Pico</CardTitle>
              <CardDescription>Distribuição de respostas por hora do dia (30 dias)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.hourly}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(h) => `${h}h`}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(h) => `${h}:00 - ${h}:59`}
                      formatter={(value: number) => [`${value}`, 'Respostas']}
                    />
                    <Bar dataKey="count" name="Respostas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </main>
      <Footer />
    </div>
  );
}
