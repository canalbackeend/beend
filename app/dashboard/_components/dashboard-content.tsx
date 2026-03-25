'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, BarChart3, MessageSquare, TrendingUp, Users, AlertTriangle, ThumbsUp, ThumbsDown, Minus, FileText, ArrowLeft, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceAngry, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrinStars, faFaceSadTear, faFaceGrin, faFaceFrownOpen } from '@fortawesome/free-solid-svg-icons';

interface Campaign {
  id: string;
  title: string;
  status: string;
  _count: { responses: number };
}

interface QuestionMetric {
  questionId: string;
  questionText: string;
  questionType: 'SMILE' | 'SIMPLE_SMILE' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT_INPUT' | 'EMPLOYEE_RATING';
  avgRating: number;
  totalAnswers: number;
  distribution: { [key: string]: number };
  optionColors?: { [key: string]: { color: string; imageUrl?: string } };
  negativeComments: any[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

interface Comment {
  responseId: string;
  questionId: string;
  questionText: string;
  questionType: string;
  answerText: string;
  rating: number | null;
  selectedOptions: string[];
  comment: string;
  date: string;
}

interface SentimentAnalysis {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  averageScore: number;
  topPositiveWords: Array<{ word: string; count: number }>;
  topNegativeWords: Array<{ word: string; count: number }>;
  comments: Array<{
    text: string;
    sentiment: 'Positivo' | 'Neutro' | 'Negativo';
    score: number;
  }>;
}

interface EmployeeRating {
  questionId: string;
  questionText: string;
  questionType: string;
  totalRatings: number;
  avgRating: number;
  distribution: {
    label: string;
    count: number;
    percentage: number;
    color: string;
  }[];
}

interface EmployeeMetric {
  employeeId: string;
  employeeName: string;
  employeeImageUrl?: string;
  totalResponses: number;
  ratings: EmployeeRating[];
}

interface Analytics {
  campaign: { id: string; title: string };
  totalResponses: number;
  overallAvg: number;
  npsScore: number | null;
  questionMetrics: QuestionMetric[];
  responsesOverTime: { [key: string]: number };
  promoters?: number;
  passives?: number;
  detractors?: number;
  allComments?: Comment[];
  sentimentAnalysis?: SentimentAnalysis;
  employeeMetrics?: EmployeeMetric[];
}

const getQuestionTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    'SMILE': 'Smile',
    'SIMPLE_SMILE': 'Smile Simples',
    'NPS': 'NPS',
    'SINGLE_CHOICE': 'Escolha Única',
    'MULTIPLE_CHOICE': 'Múltipla Escolha',
    'SCALE': 'Escala',
    'TEXT_INPUT': 'Texto Aberto',
    'EMPLOYEE_RATING': 'Avaliação de Colaborador'
  };
  return labels[type] || type;
};

interface Terminal {
  id: string;
  name: string;
  email: string;
  campaignId: string;
}

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewAsUserId = searchParams?.get('viewAsUser');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>('all');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('30');
  const [viewingUserName, setViewingUserName] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
    fetchTerminals();
  }, [viewAsUserId]);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchAnalytics(selectedCampaignId);
    }
  }, [selectedCampaignId, dateFilter, selectedTerminalId]);

  // Resetar terminal selecionado ao mudar de campanha
  useEffect(() => {
    setSelectedTerminalId('all');
  }, [selectedCampaignId]);

  const fetchCampaigns = async () => {
    try {
      const url = viewAsUserId ? `/api/campaigns?viewAsUser=${viewAsUserId}` : '/api/campaigns';
      const response = await fetch(url);
      const data = await response.json();
      
      // Se estamos visualizando como outro usuário, buscar o nome dele
      if (viewAsUserId && data?.userInfo) {
        setViewingUserName(data.userInfo.name);
      }
      
      setCampaigns(data?.campaigns ?? data ?? []);
      if ((data?.campaigns ?? data)?.length > 0) {
        setSelectedCampaignId((data?.campaigns ?? data)[0].id);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerminals = async () => {
    try {
      const response = await fetch('/api/terminals');
      const data = await response.json();
      setTerminals(data ?? []);
    } catch (error) {
      console.error('Error fetching terminals:', error);
    }
  };

  const fetchAnalytics = async (campaignId: string) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateFilter));
      
      // Construir URL com parâmetros
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
      });
      
      if (viewAsUserId) {
        params.append('viewAsUser', viewAsUserId);
      }
      
      if (selectedTerminalId && selectedTerminalId !== 'all') {
        params.append('terminalId', selectedTerminalId);
      }
      
      const url = `/api/analytics/${campaignId}?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      setAnalytics(data ?? null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const selectedCampaign = campaigns?.find((c) => c.id === selectedCampaignId);

  const smileIcons = [
    { icon: faFaceAngry, label: 'Muito Insatisfeito', color: 'text-red-500', bg: 'bg-red-500' },
    { icon: faFaceFrown, label: 'Insatisfeito', color: 'text-orange-500', bg: 'bg-orange-500' },
    { icon: faFaceMeh, label: 'Regular', color: 'text-yellow-500', bg: 'bg-yellow-500' },
    { icon: faFaceSmile, label: 'Satisfeito', color: 'text-lime-500', bg: 'bg-lime-500' },
    { icon: faFaceGrinStars, label: 'Muito Satisfeito', color: 'text-green-500', bg: 'bg-green-500' },
  ];

  const getScoreColor = (score: number, type: string) => {
    if (type === 'SMILE') {
      if (score >= 4.5) return 'text-green-600';
      if (score >= 3.5) return 'text-yellow-600';
      return 'text-red-600';
    } else if (type === 'SIMPLE_SMILE') {
      if (score >= 3.5) return 'text-green-600';
      if (score >= 2.5) return 'text-lime-600';
      if (score >= 1.5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (score >= 8) return 'text-green-600';
      if (score >= 6) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getProgressBarColor = (percentage: number, index: number, type: string) => {
    if (type === 'SMILE') {
      const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
      return colors[index] || 'bg-blue-500';
    }
    if (index <= 6) return 'bg-red-500';
    if (index <= 8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-6xl"></div>
        <h2 className="text-2xl font-bold">Nenhuma campanha encontrada</h2>
        <p className="text-muted-foreground">Crie sua primeira campanha para começar</p>
        <Link href="/campaigns/new">
          <Button size="lg">Criar Campanha</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner de visualização como outro usuário */}
      {viewAsUserId && viewingUserName && (
        <Card className="border-2 border-blue-500 bg-white dark:bg-gray-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Visualizando como: {viewingUserName}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Você está visualizando os dados deste usuário como administrador
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/users')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Selecione uma campanha" />
            </SelectTrigger>
            <SelectContent>
              {campaigns?.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todos os terminais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os terminais</SelectItem>
              {terminals
                ?.filter(t => t.campaignId === selectedCampaignId)
                ?.map((terminal) => (
                  <SelectItem key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          {selectedCampaignId && (
            <Button
              onClick={() => router.push(`/dashboard/reports/${selectedCampaignId}`)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FileText className="h-4 w-4" />
              Gerar Relatório
            </Button>
          )}
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{analytics?.totalResponses ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de respondentes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-2 border-purple-500 dark:border-purple-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {analytics?.overallAvg?.toFixed(2) ?? '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(analytics?.overallAvg ?? 0) >= 7 ? 'Excelente desempenho ' : (analytics?.overallAvg ?? 0) >= 5 ? 'Bom desempenho 👍' : 'Pode melhorar '}
            </p>
          </CardContent>
        </Card>

        {analytics?.npsScore !== null && (
          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                (analytics?.npsScore ?? 0) >= 50 ? 'text-green-600' : (analytics?.npsScore ?? 0) >= 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analytics?.npsScore?.toFixed(2) ?? '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(analytics?.npsScore ?? 0) >= 50
                  ? 'Excelente 🎉'
                  : (analytics?.npsScore ?? 0) >= 0
                  ? 'Bom 👍'
                  : 'Precisa melhorar '}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-2 border-orange-500 dark:border-orange-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perguntas</CardTitle>
            <MessageSquare className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{analytics?.questionMetrics?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Perguntas na pesquisa</p>
          </CardContent>
        </Card>
      </div>

      {/* NPS Visual com Carinhas */}
      {analytics?.npsScore !== null && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Distribuição NPS
            </CardTitle>
            <CardDescription>Visão geral de promotores, neutros e detratores</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Visual NPS com Carinhas - como na imagem 1 */}
            {(() => {
              const npsQuestion = analytics?.questionMetrics?.find(m => m.questionType === 'NPS');
              const distribution = npsQuestion?.distribution || {};
              
              // Definir carinhas e cores para cada nota
              const getNpsFace = (score: number) => {
                if (score <= 6) {
                  return { icon: faFaceFrown, bgColor: 'bg-red-400', textColor: 'text-white' };
                } else if (score <= 8) {
                  return { icon: faFaceMeh, bgColor: 'bg-yellow-400', textColor: 'text-white' };
                } else {
                  return { icon: faFaceSmile, bgColor: 'bg-green-500', textColor: 'text-white' };
                }
              };
              
              return (
                <div className="mb-6">
                  <div className="flex justify-center items-end gap-1 sm:gap-2 overflow-x-auto pb-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                      const count = (distribution[score] || 0) as number;
                      const face = getNpsFace(score);
                      
                      return (
                        <div key={score} className="flex flex-col items-center min-w-[40px] sm:min-w-[50px]">
                          {/* Contagem */}
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{count}</span>
                          </div>
                          {/* Carinha */}
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${face.bgColor} rounded-lg flex items-center justify-center`}>
                            <FontAwesomeIcon icon={face.icon} className={`text-xl sm:text-2xl ${face.textColor}`} />
                          </div>
                          {/* Número da nota */}
                          <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{score}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Cards Promotores, Neutros e Detratores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const totalNps = (analytics?.promoters ?? 0) + (analytics?.passives ?? 0) + (analytics?.detractors ?? 0);
                const promotersPercent = totalNps > 0 ? ((analytics?.promoters ?? 0) / totalNps) * 100 : 0;
                const passivesPercent = totalNps > 0 ? ((analytics?.passives ?? 0) / totalNps) * 100 : 0;
                const detractorsPercent = totalNps > 0 ? ((analytics?.detractors ?? 0) / totalNps) * 100 : 0;
                
                return (
                  <>
                    <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-600">
                      <FontAwesomeIcon icon={faFaceSmile} className="text-3xl text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-green-600">{promotersPercent.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Promotores (9-10)</p>
                      <p className="text-xs text-green-600 mt-1">{analytics?.promoters ?? 0} respostas</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-yellow-500 dark:border-yellow-600">
                      <FontAwesomeIcon icon={faFaceMeh} className="text-3xl text-yellow-600 mb-2" />
                      <div className="text-2xl font-bold text-yellow-600">{passivesPercent.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Neutros (7-8)</p>
                      <p className="text-xs text-yellow-600 mt-1">{analytics?.passives ?? 0} respostas</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-red-500 dark:border-red-600">
                      <FontAwesomeIcon icon={faFaceFrown} className="text-3xl text-red-600 mb-2" />
                      <div className="text-2xl font-bold text-red-600">{detractorsPercent.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Detratores (0-6)</p>
                      <p className="text-xs text-red-600 mt-1">{analytics?.detractors ?? 0} respostas</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas por pergunta com layout em grid como na imagem 2 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Engajamento por Pergunta</h2>
        
        {/* Grid de Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {analytics?.questionMetrics?.map((metric, index) => {
            const totalAnswers = metric.totalAnswers || 1;
            const distributionEntries = Object.entries(metric.distribution ?? {});
            
            // Pular NPS aqui pois já tem visualização especial acima
            if (metric.questionType === 'NPS') return null;
            
            return (
              <Card key={metric.questionId} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 line-clamp-2">
                        {metric.questionText}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-0">
                  {/* Barras de porcentagem - Layout: texto em cima, barra embaixo */}
                  <div className="space-y-4">
                    {metric.questionType === 'SMILE' && (() => {
                      const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
                      return smileIcons.map((item, idx) => {
                        const rating = idx + 1;
                        const count = (metric.distribution?.[rating] || 0) as number;
                        const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                        
                        return (
                          <div key={rating} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700 dark:text-gray-300">({count}) {item.label}</span>
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{percentage.toFixed(2)}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                              <div
                                className={`h-full ${item.bg} transition-all duration-500 rounded`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {metric.questionType === 'SIMPLE_SMILE' && (() => {
                      const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
                      return [
                        { icon: faFaceSadTear, label: 'Ruim', value: 1, color: 'text-red-600', bg: 'bg-red-500' },
                        { icon: faFaceMeh, label: 'Regular', value: 2, color: 'text-yellow-600', bg: 'bg-yellow-500' },
                        { icon: faFaceSmile, label: 'Bom', value: 3, color: 'text-lime-600', bg: 'bg-lime-500' },
                        { icon: faFaceGrin, label: 'Excelente', value: 4, color: 'text-green-600', bg: 'bg-green-500' },
                      ].map((item) => {
                        const count = (metric.distribution?.[item.value] || 0) as number;
                        const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                        
                        return (
                          <div key={item.value} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className={`text-sm ${item.color}`}>({count}) {item.label}</span>
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{percentage.toFixed(2)}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                              <div
                                className={`h-full ${item.bg} transition-all duration-500 rounded`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {metric.questionType === 'TEXT_INPUT' && (
                      <div className="text-center py-4">
                        <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Pergunta aberta
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {metric.totalAnswers} respostas
                        </p>
                      </div>
                    )}
                    
                    {(metric.questionType === 'SINGLE_CHOICE' || metric.questionType === 'MULTIPLE_CHOICE') && distributionEntries.length > 0 && (() => {
                      const totalBase = metric.questionType === 'MULTIPLE_CHOICE' 
                        ? distributionEntries.reduce((sum, [, c]) => sum + (c as number), 0) 
                        : metric.totalAnswers;
                      
                      return (
                        <>
                          {distributionEntries.map(([option, count], idx) => {
                            const percentage = totalBase > 0 ? ((count as number) / totalBase) * 100 : 0;
                            const customColor = metric.optionColors?.[option]?.color || '#3b82f6';
                            
                            return (
                              <div key={option} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">({count as number}) {option}</span>
                                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{percentage.toFixed(2)}%</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                                  <div
                                    className="h-full transition-all duration-500 rounded"
                                    style={{ width: `${percentage}%`, backgroundColor: customColor }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}

                    {metric.questionType === 'SCALE' && distributionEntries.length > 0 && (() => {
                      const totalDistribution = distributionEntries.reduce((sum, [, c]) => sum + (c as number), 0);
                      return distributionEntries.map(([rating, count], idx) => {
                        const percentage = totalDistribution > 0 ? ((count as number) / totalDistribution) * 100 : 0;
                        const numRating = parseInt(rating);
                        const maxRating = Math.max(...distributionEntries.map(([r]) => parseInt(r)));
                        const bgColor = numRating <= maxRating / 3 ? 'bg-red-500' : numRating <= (2 * maxRating) / 3 ? 'bg-yellow-500' : 'bg-green-500';
                        const bgColorHex = numRating <= maxRating / 3 ? '#ef4444' : numRating <= (2 * maxRating) / 3 ? '#eab308' : '#22c55e';
                        
                        return (
                          <div key={rating} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700 dark:text-gray-300">({count as number}) Nota {rating}</span>
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{percentage.toFixed(2)}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                              <div
                                className="h-full transition-all duration-500 rounded"
                                style={{ width: `${percentage}%`, backgroundColor: bgColorHex }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {metric.questionType === 'EMPLOYEE_RATING' && distributionEntries.length > 0 && (() => {
                      return (
                        <div className="space-y-3">
                          {distributionEntries.map(([option, count], idx) => {
                            const percentage = metric.totalAnswers > 0 ? ((count as number) / metric.totalAnswers) * 100 : 0;
                            const customColor = metric.optionColors?.[option]?.color || '#f97316';
                            const imageUrl = metric.optionColors?.[option]?.imageUrl;
                            
                            return (
                              <div key={option} className="space-y-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {imageUrl ? (
                                      <Image
                                        src={imageUrl}
                                        alt={option}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Se a imagem falhar, mostra placeholder
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-lg">👤</div>';
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">👤</div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-700 dark:text-gray-300">({count as number}) {option}</span>
                                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{percentage.toFixed(2)}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                                  <div
                                    className="h-full transition-all duration-500 rounded"
                                    style={{ width: `${percentage}%`, backgroundColor: customColor }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Engajamento */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-muted-foreground italic">
                    <span>Engajamento</span>
                    <span>( {metric.totalAnswers ?? 0} )</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Card NPS Score especial - como na imagem 2 */}
          {analytics?.npsScore !== null && analytics?.questionMetrics?.some(m => m.questionType === 'NPS') && (() => {
            const npsQuestion = analytics?.questionMetrics?.find(m => m.questionType === 'NPS');
            const totalNps = (analytics?.promoters ?? 0) + (analytics?.passives ?? 0) + (analytics?.detractors ?? 0);
            const promotersPercent = totalNps > 0 ? ((analytics?.promoters ?? 0) / totalNps) * 100 : 0;
            const passivesPercent = totalNps > 0 ? ((analytics?.passives ?? 0) / totalNps) * 100 : 0;
            const detractorsPercent = totalNps > 0 ? ((analytics?.detractors ?? 0) / totalNps) * 100 : 0;
            
            return (
              <Card className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      NPS SCORE 0 à 100
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {npsQuestion?.questionText || 'Em uma escala de 0 à 10, qual a probabilidade de você recomendar a nossa empresa para um amigo ou familiar?'}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 pt-0">
                  {/* Score grande centralizado */}
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Sua pontuação é:</p>
                    <div className={`text-6xl font-bold ${
                      (analytics?.npsScore ?? 0) >= 50 ? 'text-green-500' : 
                      (analytics?.npsScore ?? 0) >= 0 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {Math.round(analytics?.npsScore ?? 0)}%
                    </div>
                  </div>

                  {/* Distribuição NPS */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faFaceFrown} className="text-red-500 w-5" />
                      <span className="text-xs w-24">{analytics?.detractors ?? 0} - Detratores</span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${detractorsPercent}%` }} />
                      </div>
                      <span className="text-xs w-10 text-right">{detractorsPercent.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faFaceMeh} className="text-yellow-500 w-5" />
                      <span className="text-xs w-24">{analytics?.passives ?? 0} - Neutros</span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${passivesPercent}%` }} />
                      </div>
                      <span className="text-xs w-10 text-right">{passivesPercent.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faFaceSmile} className="text-green-500 w-5" />
                      <span className="text-xs w-24">{analytics?.promoters ?? 0} - Promotores</span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${promotersPercent}%` }} />
                      </div>
                      <span className="text-xs w-10 text-right">{promotersPercent.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Engajamento */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-muted-foreground italic">
                    <span>Engajamento</span>
                    <span>( {totalNps} )</span>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Métricas por Colaborador */}
        {analytics?.employeeMetrics && analytics.employeeMetrics.length > 0 && (
          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-orange-600" />
              Avaliação por Colaborador
            </h2>
            <p className="text-muted-foreground">
              Desempenho individual de cada colaborador baseado nas avaliações dos clientes
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {analytics.employeeMetrics.map((employee) => (
                <Card key={employee.employeeId} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {employee.employeeImageUrl ? (
                          <Image
                            src={employee.employeeImageUrl}
                            alt={employee.employeeName}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold truncate">
                          {employee.employeeName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {employee.totalResponses} avaliações
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0">
                    {employee.ratings.map((rating) => (
                      <div key={rating.questionId} className="mb-4 last:mb-0">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                          {rating.questionText}
                        </p>
                        <div className="space-y-2">
                          {rating.distribution.map((item) => (
                            <div key={item.label} className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-700 dark:text-gray-300">
                                  ({item.count}) {item.label}
                                </span>
                                <span className="font-semibold text-gray-600 dark:text-gray-400">
                                  {item.percentage.toFixed(2)}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                                <div
                                  className="h-full transition-all duration-500 rounded"
                                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Média</span>
                            <span className="text-sm font-bold">
                              {rating.avgRating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Alertas e Comentários Negativos em seção separada */}
        {analytics?.questionMetrics?.some(m => m.negativeComments && m.negativeComments.length > 0) && (
          <Card className="hover:shadow-lg transition-shadow mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Alertas e Pontos de Atenção
              </CardTitle>
              <CardDescription>Comentários que merecem atenção especial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.questionMetrics?.map((metric) => {
                  if (!metric.negativeComments || metric.negativeComments.length === 0) return null;
                  
                  return (
                    <div key={metric.questionId} className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {metric.questionText}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {metric.negativeComments?.slice(0, 4)?.map((comment: any, idx: number) => (
                          <div key={idx} className="bg-white dark:bg-gray-800 border-2 border-red-500 dark:border-red-600 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              {metric.questionType === 'SMILE' && comment.rating !== null && (
                                <FontAwesomeIcon 
                                  icon={smileIcons[comment.rating - 1]?.icon || faFaceAngry} 
                                  className={`text-lg ${smileIcons[comment.rating - 1]?.color || 'text-red-500'}`} 
                                />
                              )}
                              {metric.questionType === 'SIMPLE_SMILE' && comment.rating !== null && (
                                <FontAwesomeIcon 
                                  icon={
                                    comment.rating === 1 ? faFaceSadTear : 
                                    comment.rating === 2 ? faFaceMeh : 
                                    comment.rating === 3 ? faFaceSmile : 
                                    faFaceGrin
                                  } 
                                  className={`text-lg ${
                                    comment.rating === 1 ? 'text-red-600' : 
                                    comment.rating === 2 ? 'text-yellow-600' : 
                                    comment.rating === 3 ? 'text-lime-600' : 
                                    'text-green-600'
                                  }`}
                                />
                              )}
                              {metric.questionType === 'NPS' && comment.rating !== null && (
                                <span className={`w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs ${
                                  comment.rating <= 6 ? 'bg-red-500' : comment.rating <= 8 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}>
                                  {comment.rating}
                                </span>
                              )}
                              <div className="flex-1">
                                <p className="text-xs text-gray-700 dark:text-gray-300">"{comment.comment}"</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(comment.date).toLocaleDateString('pt-BR', { 
                                    day: '2-digit', 
                                    month: 'short'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análise de Sentimento */}
      {analytics?.sentimentAnalysis && analytics.sentimentAnalysis.total > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            Análise de Sentimento
          </h2>
          <p className="text-muted-foreground">
            Análise automática do sentimento das respostas abertas (TEXT_INPUT) usando análise de palavras-chave
          </p>

          {/* Cards de Distribuição */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Positivo */}
            <Card className="hover:shadow-lg transition-shadow border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  Positivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.sentimentAnalysis.positivePercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {analytics.sentimentAnalysis.positive} de {analytics.sentimentAnalysis.total}
                  </div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${analytics.sentimentAnalysis.positivePercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Neutro */}
            <Card className="hover:shadow-lg transition-shadow border-yellow-200 dark:border-yellow-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Minus className="h-4 w-4 text-yellow-600" />
                  Neutro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analytics.sentimentAnalysis.neutralPercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {analytics.sentimentAnalysis.neutral} de {analytics.sentimentAnalysis.total}
                  </div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-yellow-500"
                    style={{ width: `${analytics.sentimentAnalysis.neutralPercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Negativo */}
            <Card className="hover:shadow-lg transition-shadow border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  Negativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-red-600">
                    {analytics.sentimentAnalysis.negativePercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {analytics.sentimentAnalysis.negative} de {analytics.sentimentAnalysis.total}
                  </div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${analytics.sentimentAnalysis.negativePercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Palavras-chave mais frequentes */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Palavras Positivas */}
            {analytics.sentimentAnalysis.topPositiveWords.length > 0 && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    Palavras Positivas Mais Frequentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.sentimentAnalysis.topPositiveWords.slice(0, 8).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 border-green-500">
                            {item.word}
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {item.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Palavras Negativas */}
            {analytics.sentimentAnalysis.topNegativeWords.length > 0 && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Palavras Negativas Mais Frequentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.sentimentAnalysis.topNegativeWords.slice(0, 8).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 border-red-500">
                            {item.word}
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {item.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Comentários por Sentimento */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Comentários por Sentimento</CardTitle>
              <CardDescription>
                Visualize os comentários classificados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtro por sentimento */}
                <div className="flex gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 border-green-500 hover:bg-green-50 dark:hover:bg-green-900"
                  >
                    Positivos ({analytics.sentimentAnalysis.comments.filter(c => c.sentiment === 'Positivo').length})
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer bg-white dark:bg-gray-800 text-yellow-700 dark:text-yellow-300 border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900"
                  >
                    Neutros ({analytics.sentimentAnalysis.comments.filter(c => c.sentiment === 'Neutro').length})
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 border-red-500 hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    Negativos ({analytics.sentimentAnalysis.comments.filter(c => c.sentiment === 'Negativo').length})
                  </Badge>
                </div>

                {/* Lista de comentários (mostrando até 10) */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analytics.sentimentAnalysis.comments.slice(0, 10).map((comment, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 ${
                        comment.sentiment === 'Positivo'
                          ? 'bg-white dark:bg-gray-800 border-green-500 dark:border-green-600'
                          : comment.sentiment === 'Negativo'
                          ? 'bg-white dark:bg-gray-800 border-red-500 dark:border-red-600'
                          : 'bg-white dark:bg-gray-800 border-yellow-500 dark:border-yellow-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={
                            comment.sentiment === 'Positivo'
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : comment.sentiment === 'Negativo'
                              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                          }
                        >
                          {comment.sentiment}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Score: {(comment.score * 100).toFixed(0)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        "{comment.text}"
                      </p>
                    </div>
                  ))}
                </div>

                {analytics.sentimentAnalysis.comments.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Mostrando 10 de {analytics.sentimentAnalysis.comments.length} comentários
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico de Comentários */}
      {analytics?.allComments && analytics.allComments.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">
            Histórico de Comentários</h2>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-purple-600" />
                Todos os Comentários ({analytics.allComments.length})
              </CardTitle>
              <CardDescription>Histórico completo de comentários com perguntas e respostas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.allComments.map((commentItem, index) => (
                  <div
                    key={`${commentItem.responseId}-${commentItem.questionId}-${index}`}
                    className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Cabeçalho com pergunta e tipo */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getQuestionTypeLabel(commentItem.questionType)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(commentItem.date).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                            {commentItem.questionText}
                          </p>
                        </div>
                      </div>

                      {/* Resposta */}
                      <div className="pl-4 border-l-2 border-blue-500">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                          Resposta: {commentItem.answerText}
                        </p>
                      </div>

                      {/* Comentário */}
                      <div className="pl-4 border-l-2 border-green-500">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold text-green-700 dark:text-green-400">Comentário:</span> "
                          {commentItem.comment}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
