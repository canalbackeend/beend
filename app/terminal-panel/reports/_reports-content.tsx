'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { AlertTriangle, FileText, Printer, MessageSquare, Calendar } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceAngry, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrinStars, faFaceSadTear, faFaceGrin, faChartColumn } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { DateRange } from 'react-day-picker';

interface QuestionMetric {
  questionId: string;
  questionText: string;
  questionType: 'SMILE' | 'SIMPLE_SMILE' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT_INPUT';
  avgRating: number;
  totalAnswers: number;
  distribution: { [key: string]: number };
  optionColors?: { [key: string]: { color: string } };
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

interface ReportData {
  terminalName: string;
  campaignTitle: string;
  totalResponses: number;
  overallAverage: string;
  npsScore: string | null;
  promoters?: number;
  passives?: number;
  detractors?: number;
  questionMetrics: QuestionMetric[];
  responses: any[];
  allComments?: Comment[];
  sentimentAnalysis?: SentimentAnalysis;
}

const getQuestionTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    'SMILE': 'Smile',
    'SIMPLE_SMILE': 'Smile Simples',
    'NPS': 'NPS',
    'SINGLE_CHOICE': 'Escolha Única',
    'MULTIPLE_CHOICE': 'Múltipla Escolha',
    'SCALE': 'Escala',
    'TEXT_INPUT': 'Texto Aberto'
  };
  return labels[type] || type;
};

// Paleta de cores para barras de progresso
const PROGRESS_COLORS = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-violet-600',
  'bg-fuchsia-600',
  'bg-rose-600',
  'bg-amber-600',
];

export default function TerminalPanelReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('30');
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    fetchReportData();
    fetchProfile();
  }, [dateFilter, customDateRange]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/terminal-panel/profile');
      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.parentUser?.logoUrl || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      let url = '/api/terminal-panel/reports?';
      
      if (isCustomRange && customDateRange?.from) {
        url += `startDate=${customDateRange.from.toISOString()}`;
        if (customDateRange.to) {
          url += `&endDate=${customDateRange.to.toISOString()}`;
        }
      } else if (dateFilter !== 'all') {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateFilter));
        url += `startDate=${startDate.toISOString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDateFilterChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomRange(true);
    } else {
      setIsCustomRange(false);
      setCustomDateRange(undefined);
      setDateFilter(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⌛</div>
          <p className="text-muted-foreground">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-muted-foreground">Erro ao carregar relatório</p>
        </div>
      </div>
    );
  }

  const hasNPS = reportData.npsScore !== null;
  const { promoters = 0, passives = 0, detractors = 0, totalResponses } = reportData;

  const npsPercentages = hasNPS && totalResponses > 0 ? {
    promoters: ((promoters / totalResponses) * 100).toFixed(1),
    passives: ((passives / totalResponses) * 100).toFixed(1),
    detractors: ((detractors / totalResponses) * 100).toFixed(1),
  } : { promoters: '0', passives: '0', detractors: '0' };

  return (
    <div className="space-y-6">
      {/* Header com botões e filtros */}
      <div className="no-print flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Relatório de Análise
            </h1>
            <div className="mt-1.5 space-y-0.5">
              <p className="text-sm text-muted-foreground">
                Terminal: <span className="font-medium text-foreground">{reportData.terminalName}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Campanha: <span className="font-medium text-foreground">{reportData.campaignTitle}</span>
              </p>
            </div>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Relatório
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros de Período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select
                  value={isCustomRange ? 'custom' : dateFilter}
                  onValueChange={handleDateFilterChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="60">Últimos 60 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="all">Todo o período</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isCustomRange && (
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Intervalo Personalizado</label>
                  <DateRangePicker
                    value={customDateRange as DateRange}
                    onChange={setCustomDateRange}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cabeçalho para impressão */}
      <div className="print-only hidden">
        <div className="flex items-center justify-between mb-8">
          {logoUrl ? (
            <div className="relative h-16 w-32">
              <Image
                src={logoUrl}
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="relative h-16 w-32">
              <Image
                src="/logo-backeend.png"
                alt="Logo Backeend"
                fill
                className="object-contain"
              />
            </div>
          )}
          <div className="text-right">
            <h1 className="text-2xl font-bold">Relatório de Análise</h1>
            <div className="mt-1 space-y-0.5 text-sm">
              <p className="text-muted-foreground">
                Terminal: <span className="font-medium text-foreground">{reportData.terminalName}</span>
              </p>
              <p className="text-muted-foreground">
                Campanha: <span className="font-medium text-foreground">{reportData.campaignTitle}</span>
              </p>
              <p className="text-muted-foreground">
                Gerado em: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-stats">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Total de Respostas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{totalResponses}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Respostas coletadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Média Geral</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{reportData.overallAverage}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">De 5.0 possíveis (excl. NPS)</p>
          </CardContent>
        </Card>

        {hasNPS && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">NPS Score</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{reportData.npsScore}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Net Promoter Score</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análise NPS Detalhada */}
      {hasNPS && (
        <Card className="print-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faChartColumn} className="h-5 w-5" />
              Análise NPS
            </CardTitle>
            <CardDescription>
              Distribuição de promotores, neutros e detratores
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Promotores */}
              <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 print-card-green">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-green-700">Promotores (9-10)</span>
                  <FontAwesomeIcon icon={faFaceSmile} className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">
                  {npsPercentages.promoters}%
                </div>
                <div className="text-xs text-green-600 mb-2">
                  {promoters} respostas
                </div>
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{ width: `${npsPercentages.promoters}%` }}
                  />
                </div>
              </div>

              {/* Neutros */}
              <div className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 print-card-yellow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-yellow-700">Neutros (7-8)</span>
                  <FontAwesomeIcon icon={faFaceMeh} className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-700 mb-1">
                  {npsPercentages.passives}%
                </div>
                <div className="text-xs text-yellow-600 mb-2">
                  {passives} respostas
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-1.5">
                  <div
                    className="bg-yellow-600 h-1.5 rounded-full"
                    style={{ width: `${npsPercentages.passives}%` }}
                  />
                </div>
              </div>

              {/* Detratores */}
              <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 print-card-red">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-red-700">Detratores (0-6)</span>
                  <FontAwesomeIcon icon={faFaceFrown} className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-700 mb-1">
                  {npsPercentages.detractors}%
                </div>
                <div className="text-xs text-red-600 mb-2">
                  {detractors} respostas
                </div>
                <div className="w-full bg-red-200 rounded-full h-1.5">
                  <div
                    className="bg-red-600 h-1.5 rounded-full"
                    style={{ width: `${npsPercentages.detractors}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise por Questão */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold print-section-title">Análise por Questão</h2>
        {reportData.questionMetrics.map((metric, index) => (
          <Card key={metric.questionId} className="print-section">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{metric.questionText}</CardTitle>
                  <CardDescription className="mt-1">
                    <Badge variant="outline">{getQuestionTypeLabel(metric.questionType)}</Badge>
                    <span className="ml-2 text-muted-foreground">
                      {metric.totalAnswers} resposta{metric.totalAnswers !== 1 ? 's' : ''}
                    </span>
                  </CardDescription>
                </div>
                {(metric.questionType === 'SMILE' || metric.questionType === 'SIMPLE_SMILE' || metric.questionType === 'SCALE') && (
                  <div className="text-right">
                    <div className="text-3xl font-bold">{metric.avgRating.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Média</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Distribuição SMILE */}
              {metric.questionType === 'SMILE' && (() => {
                // Calcular total da distribuição (soma de todas as opções)
                const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
                return (
                  <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const count = metric.distribution[rating.toString()] || 0;
                      const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                      const icons = [faFaceSadTear, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrin];
                      const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-emerald-500'];
                      return (
                        <div key={rating} className="text-center p-4 rounded-lg bg-muted">
                          <FontAwesomeIcon icon={icons[rating - 1]} className={`h-8 w-8 ${colors[rating - 1]} mb-2`} />
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Distribuição SIMPLE_SMILE */}
              {metric.questionType === 'SIMPLE_SMILE' && (() => {
                // Calcular total da distribuição (soma de todas as opções)
                const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
                return (
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((rating) => {
                      const count = metric.distribution[rating.toString()] || 0;
                      const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                      const labels = ['Ruim', 'Regular', 'Bom', 'Excelente'];
                      const icons = [faFaceSadTear, faFaceFrown, faFaceSmile, faFaceGrin];
                      const colors = ['text-red-500', 'text-yellow-500', 'text-green-500', 'text-emerald-500'];
                      return (
                        <div key={rating} className="text-center p-4 rounded-lg bg-muted">
                          <FontAwesomeIcon icon={icons[rating - 1]} className={`h-8 w-8 ${colors[rating - 1]} mb-2`} />
                          <div className="text-sm font-medium mb-1">{labels[rating - 1]}</div>
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Distribuição NPS */}
              {metric.questionType === 'NPS' && (() => {
                // Calcular total da distribuição (soma de todas as opções)
                const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-11 gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                        const count = metric.distribution[score.toString()] || 0;
                        const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                        let colorClass = 'bg-red-100 text-red-700 print-bg-red';
                        if (score >= 7 && score <= 8) colorClass = 'bg-yellow-100 text-yellow-700 print-bg-yellow';
                        if (score >= 9) colorClass = 'bg-green-100 text-green-700 print-bg-green';

                        return (
                          <div key={score} className="text-center">
                            <div className={`p-2 rounded-lg ${colorClass} font-bold`}>
                              {score}
                            </div>
                            <div className="text-xs mt-1">{count}</div>
                            <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Distribuição SCALE */}
              {metric.questionType === 'SCALE' && (() => {
                // Calcular total da distribuição (soma de todas as opções)
                const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>{metric.scaleMinLabel || `${metric.scaleMin || 0} (Mínimo)`}</span>
                      <span>{metric.scaleMaxLabel || `${metric.scaleMax || 10} (Máximo)`}</span>
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(metric.scaleMax || 10) - (metric.scaleMin || 0) + 1}, minmax(0, 1fr))` }}>
                      {Array.from({ length: (metric.scaleMax || 10) - (metric.scaleMin || 0) + 1 }, (_, i) => i + (metric.scaleMin || 0)).map((value) => {
                        const count = metric.distribution[value.toString()] || 0;
                        const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                        return (
                          <div key={value} className="text-center">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 print-bg-blue font-bold">
                              {value}
                            </div>
                            <div className="text-xs mt-1">{count}</div>
                            <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Distribuição CHOICE com cores variadas */}
              {(metric.questionType === 'SINGLE_CHOICE' || metric.questionType === 'MULTIPLE_CHOICE') && (() => {
                // Para MULTIPLE_CHOICE: base = total de SELEÇÕES feitas
                // Para SINGLE_CHOICE: base = total de PESSOAS que responderam
                const totalBase = metric.questionType === 'MULTIPLE_CHOICE' 
                  ? Object.values(metric.distribution).reduce((sum, c) => sum + (c as number), 0) 
                  : metric.totalAnswers;
                
                return (
                  <div className="space-y-3">
                    {Object.entries(metric.distribution).map(([option, count], idx) => {
                      const percentage = totalBase > 0 ? ((count as number) / totalBase) * 100 : 0;
                      const customColor = metric.optionColors?.[option]?.color || '#3b82f6';
                      return (
                        <div key={option} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{option}</span>
                            <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${percentage}%`, backgroundColor: customColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Comentários Negativos / Alertas */}
              {metric.negativeComments.length > 0 && (
                <div className="mt-6 pt-6 border-t print-section">
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    {metric.questionType === 'TEXT_INPUT' ? 'Comentários' : 'Alertas - Pontos de Atenção'}
                  </h4>
                  <div className="space-y-3">
                    {metric.negativeComments.slice(0, 10).map((comment, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-orange-50 border border-orange-200 print-alert">
                        <div className="flex items-start gap-3">
                          {metric.questionType !== 'TEXT_INPUT' && comment.rating !== null && (
                            <div className="flex-shrink-0">
                              {metric.questionType === 'SMILE' && (
                                <FontAwesomeIcon
                                  icon={[faFaceSadTear, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrin][comment.rating - 1]}
                                  className="h-6 w-6 text-orange-600"
                                />
                              )}
                              {metric.questionType === 'SIMPLE_SMILE' && (
                                <div>
                                  <FontAwesomeIcon
                                    icon={[faFaceSadTear, faFaceFrown, faFaceSmile, faFaceGrin][comment.rating - 1]}
                                    className="h-6 w-6 text-orange-600"
                                  />
                                  <div className="text-xs text-center text-orange-600 mt-1">
                                    {['Ruim', 'Regular', 'Bom', 'Excelente'][comment.rating - 1]}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{comment.comment}</p>
                            {comment.date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(comment.date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Análise de Sentimento */}
      {reportData.sentimentAnalysis && reportData.sentimentAnalysis.total > 0 && (
        <Card className="print-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-purple-600" />
              Análise de Sentimento
            </CardTitle>
            <CardDescription>
              Análise automática baseada em palavras-chave das respostas abertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Distribuição de Sentimentos */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="border rounded-lg p-3 print-card-green">
                <div className="text-xs text-gray-600 mb-1">✅ Positivo</div>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.sentimentAnalysis.positivePercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {reportData.sentimentAnalysis.positive} respostas
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-green-500"
                    style={{ width: `${reportData.sentimentAnalysis.positivePercentage}%` }}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-3 print-card-yellow">
                <div className="text-xs text-gray-600 mb-1">➖ Neutro</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.sentimentAnalysis.neutralPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {reportData.sentimentAnalysis.neutral} respostas
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-yellow-500"
                    style={{ width: `${reportData.sentimentAnalysis.neutralPercentage}%` }}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-3 print-card-red">
                <div className="text-xs text-gray-600 mb-1">⚠️ Negativo</div>
                <div className="text-2xl font-bold text-red-600">
                  {reportData.sentimentAnalysis.negativePercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {reportData.sentimentAnalysis.negative} respostas
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-red-500"
                    style={{ width: `${reportData.sentimentAnalysis.negativePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Palavras-chave */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Palavras Positivas */}
              {reportData.sentimentAnalysis.topPositiveWords.length > 0 && (
                <div className="border rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2 text-green-700">
                    ✅ Palavras Positivas Mais Frequentes
                  </h3>
                  <div className="space-y-1">
                    {reportData.sentimentAnalysis.topPositiveWords.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-green-600">{item.word}</span>
                        <span className="text-gray-500">{item.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Palavras Negativas */}
              {reportData.sentimentAnalysis.topNegativeWords.length > 0 && (
                <div className="border rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2 text-red-700">
                    ⚠️ Palavras Negativas Mais Frequentes
                  </h3>
                  <div className="space-y-1">
                    {reportData.sentimentAnalysis.topNegativeWords.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-red-600">{item.word}</span>
                        <span className="text-gray-500">{item.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Exemplos de Comentários por Sentimento */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Exemplos de Comentários</h3>
              <div className="space-y-2">
                {reportData.sentimentAnalysis.comments.slice(0, 5).map((comment, index) => (
                  <div
                    key={index}
                    className={`border-l-4 pl-3 py-2 text-xs ${
                      comment.sentiment === 'Positivo'
                        ? 'border-green-500 bg-green-50'
                        : comment.sentiment === 'Negativo'
                        ? 'border-red-500 bg-red-50'
                        : 'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-semibold ${
                          comment.sentiment === 'Positivo'
                            ? 'text-green-700'
                            : comment.sentiment === 'Negativo'
                            ? 'text-red-700'
                            : 'text-yellow-700'
                        }`}
                      >
                        {comment.sentiment}
                      </span>
                      <span className="text-gray-500">
                        (Score: {(comment.score * 100).toFixed(0)})
                      </span>
                    </div>
                    <p className="text-gray-700 italic">"{comment.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de TODOS os Comentários */}
      {reportData.allComments && reportData.allComments.length > 0 && (
        <Card className="print-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Todos os Comentários ({reportData.allComments.length})
            </CardTitle>
            <CardDescription>
              Lista completa de todos os comentários deixados pelos respondentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.allComments.map((comment, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted border print-comment">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{comment.questionText}</div>
                      <Badge variant="outline" className="mt-1">
                        {getQuestionTypeLabel(comment.questionType)}
                      </Badge>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {new Date(comment.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  {comment.rating !== null && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Avaliação: {comment.rating}
                    </div>
                  )}

                  {comment.selectedOptions && comment.selectedOptions.length > 0 && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Resposta: {comment.selectedOptions.join(', ')}
                    </div>
                  )}

                  <div className="text-sm mt-2 p-3 bg-background rounded border">
                    "{comment.comment}"
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer para impressão */}
      <div className="print-only hidden">
        <div className="text-center text-sm text-muted-foreground border-t pt-4 mt-8">
          <p>© {new Date().getFullYear()} Backeend. Todos os direitos reservados.</p>
          <p className="mt-1">Relatório gerado automaticamente pelo sistema de pesquisa de satisfação.</p>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style jsx global>{`
        @media print {
          /* Ocultar elementos que não devem ser impressos */
          .no-print {
            display: none !important;
          }

          /* Mostrar apenas elementos de impressão */
          .print-only {
            display: block !important;
          }

          /* Forçar quebras de página inteligentes */
          .print-section {
            page-break-inside: avoid;
            margin-bottom: 1rem;
          }

          .print-section-title {
            page-break-after: avoid;
            margin-top: 2rem;
          }

          .print-stats {
            page-break-inside: avoid;
          }

          /* Cores para impressão */
          .print-card-green {
            background-color: #f0fdf4 !important;
            border-color: #bbf7d0 !important;
            color: #15803d !important;
          }

          .print-card-yellow {
            background-color: #fefce8 !important;
            border-color: #fef08a !important;
            color: #a16207 !important;
          }

          .print-card-red {
            background-color: #fef2f2 !important;
            border-color: #fecaca !important;
            color: #b91c1c !important;
          }

          .print-bg-red {
            background-color: #fee2e2 !important;
            color: #b91c1c !important;
          }

          .print-bg-yellow {
            background-color: #fef9c3 !important;
            color: #a16207 !important;
          }

          .print-bg-green {
            background-color: #dcfce7 !important;
            color: #15803d !important;
          }

          .print-bg-blue {
            background-color: #dbeafe !important;
            color: #1e40af !important;
          }

          .print-alert {
            background-color: #fff7ed !important;
            border-color: #fed7aa !important;
            page-break-inside: avoid;
          }

          .print-comment {
            page-break-inside: avoid;
            margin-bottom: 0.5rem;
          }

          /* Ajustes gerais de impressão */
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          * {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
