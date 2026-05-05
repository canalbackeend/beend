'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, BarChart3, MessageSquare, TrendingUp, Users, AlertTriangle, ThumbsUp, ThumbsDown, Minus, FileText, Download } from 'lucide-react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceAngry, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrinStars, faFaceSadTear, faFaceGrin, faFaceFrownOpen } from '@fortawesome/free-solid-svg-icons';

interface Campaign {
  id: string;
  campaignId: string;
  title: string;
  description?: string;
  customTitle?: string;
  icon: string;
  color: string;
  campaign: {
    id: string;
    title: string;
    status: string;
    questions: any[];
  };
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
  terminal: { id: string; name: string; email: string };
  campaigns: Campaign[];
  hasMultipleCampaigns: boolean;
  campaign: { id: string; title: string } | null;
  totalResponses: number;
  overallAvg: number;
  npsScore: number | null;
  questionMetrics: QuestionMetric[];
  responsesOverTime: { [key: string]: number };
  responsesLast7Days: number;
  responsesLast30Days: number;
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

export default function TerminalPanelDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (selectedCampaignId && analytics?.campaigns?.length > 0) {
      fetchCampaignAnalytics(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/terminal-panel/dashboard');
      const data = await response.json();
      setAnalytics(data);

      if (data?.campaigns?.length > 0) {
        if (data.hasMultipleCampaigns) {
          setSelectedCampaignId(data.campaigns[0].id);
        } else {
          setSelectedCampaignId(data.campaigns[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignAnalytics = async (terminalCampaignId: string) => {
    if (!analytics) return;

    const tc = analytics.campaigns.find((c) => c.id === terminalCampaignId);
    if (!tc) return;

    const campaignId = tc.campaignId;

    try {
      const response = await fetch(`/api/analytics/${campaignId}?days=365`);
      const data = await response.json();

      if (data) {
        setAnalytics((prev) => prev ? {
          ...prev,
          campaign: { id: tc.campaign.id, title: tc.campaign.title },
          totalResponses: data.totalResponses,
          overallAvg: data.overallAvg,
          npsScore: data.npsScore,
          promoters: data.promoters,
          passives: data.passives,
          detractors: data.detractors,
          questionMetrics: data.questionMetrics,
          allComments: data.allComments,
          sentimentAnalysis: data.sentimentAnalysis,
          employeeMetrics: data.employeeMetrics,
        } : null);
      }
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⌛</div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-muted-foreground">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  const smileIcons = [
    { icon: faFaceAngry, label: 'Muito Insatisfeito', color: 'text-red-500', bg: 'bg-red-500' },
    { icon: faFaceFrown, label: 'Insatisfeito', color: 'text-orange-500', bg: 'bg-orange-500' },
    { icon: faFaceMeh, label: 'Regular', color: 'text-yellow-500', bg: 'bg-yellow-500' },
    { icon: faFaceSmile, label: 'Satisfeito', color: 'text-lime-500', bg: 'bg-lime-500' },
    { icon: faFaceGrinStars, label: 'Muito Satisfeito', color: 'text-green-500', bg: 'bg-green-500' },
  ];

  const { npsScore, promoters = 0, passives = 0, detractors = 0, totalResponses } = analytics;
  const hasNPS = npsScore !== null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Terminal: {analytics.terminal.name}
          </p>
        </div>

        {/* Seletor de campanha */}
        {analytics.hasMultipleCampaigns && analytics.campaigns?.length > 0 && (
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Selecione uma campanha" />
            </SelectTrigger>
            <SelectContent>
              {analytics.campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.customTitle || campaign.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{analytics.totalResponses}</div>
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
              {analytics.overallAvg?.toFixed(2) ?? '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(analytics.overallAvg ?? 0) >= 7 ? 'Excelente desempenho ' : (analytics.overallAvg ?? 0) >= 5 ? 'Bom desempenho 👍' : 'Pode melhorar '}
            </p>
          </CardContent>
        </Card>

        {analytics.npsScore !== null && (
          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                (analytics.npsScore ?? 0) >= 50 ? 'text-green-600' : (analytics.npsScore ?? 0) >= 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analytics.npsScore?.toFixed(2) ?? '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(analytics.npsScore ?? 0) >= 50 ? 'Excelente 🎉' : (analytics.npsScore ?? 0) >= 0 ? 'Bom 👍' : 'Precisa melhorar '}
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
            <div className="text-3xl font-bold text-orange-600">{analytics.questionMetrics?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Perguntas na pesquisa</p>
          </CardContent>
        </Card>
      </div>

      {/* NPS Visual com Carinhas */}
      {analytics.npsScore !== null && analytics.questionMetrics?.some(m => m.questionType === 'NPS') && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Distribuição NPS
            </CardTitle>
            <CardDescription>Visão geral de promotores, neutros e detratores</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Cards Promotores, Neutros e Detratores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const totalNps = (promoters || 0) + (passives || 0) + (detractors || 0);
                const promotersPercent = totalNps > 0 ? ((promoters || 0) / totalNps) * 100 : 0;
                const passivesPercent = totalNps > 0 ? ((passives || 0) / totalNps) * 100 : 0;
                const detractorsPercent = totalNps > 0 ? ((detractors || 0) / totalNps) * 100 : 0;
                
                return (
                  <>
                    <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-600">
                      <FontAwesomeIcon icon={faFaceSmile} className="text-3xl text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-green-600">{promotersPercent.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Promotores (9-10)</p>
                      <p className="text-xs text-green-600 mt-1">{promoters || 0} respostas</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-yellow-500 dark:border-yellow-600">
                      <FontAwesomeIcon icon={faFaceMeh} className="text-3xl text-yellow-600 mb-2" />
                      <div className="text-2xl font-bold text-yellow-600">{passivesPercent.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Neutros (7-8)</p>
                      <p className="text-xs text-yellow-600 mt-1">{passives || 0} respostas</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-red-500 dark:border-red-600">
                      <FontAwesomeIcon icon={faFaceFrown} className="text-3xl text-red-600 mb-2" />
                      <div className="text-2xl font-bold text-red-600">{detractorsPercent.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Detratores (0-6)</p>
                      <p className="text-xs text-red-600 mt-1">{detractors || 0} respostas</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas por pergunta */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Engajamento por Pergunta</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {analytics.questionMetrics?.map((metric, index) => {
            const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
            
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
                  {/* Distribuição SMILE */}
                  {metric.questionType === 'SMILE' && (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((rating) => {
                        const count = (metric.distribution?.[rating] || 0) as number;
                        const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                        
                        return (
                          <div key={rating} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700 dark:text-gray-300">({count}) {smileIcons[rating - 1]?.label}</span>
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{percentage.toFixed(2)}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                              <div
                                className={`h-full ${smileIcons[rating - 1]?.bg} transition-all duration-500 rounded`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Distribuição SIMPLE_SMILE */}
                  {metric.questionType === 'SIMPLE_SMILE' && (
                    <div className="space-y-4">
                      {[
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
                      })}
                    </div>
                  )}

                  {/* TEXT_INPUT */}
                  {metric.questionType === 'TEXT_INPUT' && (
                    <div className="text-center py-4">
                      <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Pergunta aberta</p>
                      <p className="text-xs text-muted-foreground">{metric.totalAnswers} respostas</p>
                    </div>
                  )}

                  {/* SINGLE_CHOICE / MULTIPLE_CHOICE */}
                  {(metric.questionType === 'SINGLE_CHOICE' || metric.questionType === 'MULTIPLE_CHOICE') && Object.entries(metric.distribution || {}).length > 0 && (
                    <div className="space-y-3">
                      {Object.entries(metric.distribution).map(([option, count]) => {
                        const percentage = totalDistribution > 0 ? ((count as number) / totalDistribution) * 100 : 0;
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
                    </div>
                  )}

                  {/* SCALE */}
                  {metric.questionType === 'SCALE' && Object.entries(metric.distribution || {}).length > 0 && (
                    <div className="space-y-3">
                      {Object.entries(metric.distribution).map(([rating, count]) => {
                        const percentage = totalDistribution > 0 ? ((count as number) / totalDistribution) * 100 : 0;
                        const numRating = parseInt(rating);
                        const maxRating = Math.max(...Object.keys(metric.distribution).map((r) => parseInt(r)));
                        const bgColor = numRating <= maxRating / 3 ? '#ef4444' : numRating <= (2 * maxRating) / 3 ? '#eab308' : '#22c55e';
                        
                        return (
                          <div key={rating} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700 dark:text-gray-300">({count as number}) Nota {rating}</span>
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{percentage.toFixed(2)}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                              <div
                                className="h-full transition-all duration-500 rounded"
                                style={{ width: `${percentage}%`, backgroundColor: bgColor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* EMPLOYEE_RATING */}
                  {metric.questionType === 'EMPLOYEE_RATING' && Object.entries(metric.distribution || {}).length > 0 && (
                    <div className="space-y-3">
                      {Object.entries(metric.distribution).map(([option, count]) => {
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
                  )}

                  {/* Engajamento */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-muted-foreground italic">
                    <span>Engajamento</span>
                    <span>( {metric.totalAnswers ?? 0} )</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Card NPS Score especial */}
          {analytics.npsScore !== null && analytics.questionMetrics?.some(m => m.questionType === 'NPS') && (
            <Card className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    NPS SCORE 0 à 100
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Em uma escala de 0 à 10, qual a probabilidade de você recomendar a nossa empresa para um amigo ou familiar?
                </p>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">Sua pontuação é:</p>
                  <div className={`text-6xl font-bold ${
                    (analytics.npsScore ?? 0) >= 50 ? 'text-green-500' : 
                    (analytics.npsScore ?? 0) >= 0 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {Math.round(analytics.npsScore ?? 0)}%
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faFaceFrown} className="text-red-500 w-5" />
                    <span className="text-xs w-24">{detractors || 0} - Detratores</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${(detractors || 0) / totalResponses * 100}%` }} />
                    </div>
                    <span className="text-xs w-10 text-right">{((detractors || 0) / totalResponses * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faFaceMeh} className="text-yellow-500 w-5" />
                    <span className="text-xs w-24">{passives || 0} - Neutros</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${(passives || 0) / totalResponses * 100}%` }} />
                    </div>
                    <span className="text-xs w-10 text-right">{((passives || 0) / totalResponses * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faFaceSmile} className="text-green-500 w-5" />
                    <span className="text-xs w-24">{promoters || 0} - Promotores</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${(promoters || 0) / totalResponses * 100}%` }} />
                    </div>
                    <span className="text-xs w-10 text-right">{((promoters || 0) / totalResponses * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-muted-foreground italic">
                  <span>Engajamento</span>
                  <span>( {totalResponses} )</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Análise de Sentimento */}
      {analytics.sentimentAnalysis && analytics.sentimentAnalysis.total > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            Análise de Sentimento
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
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
                  <div className="h-2 rounded-full bg-green-500" style={{ width: `${analytics.sentimentAnalysis.positivePercentage}%` }} />
                </div>
              </CardContent>
            </Card>

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
                  <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${analytics.sentimentAnalysis.neutralPercentage}%` }} />
                </div>
              </CardContent>
            </Card>

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
                  <div className="h-2 rounded-full bg-red-500" style={{ width: `${analytics.sentimentAnalysis.negativePercentage}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}