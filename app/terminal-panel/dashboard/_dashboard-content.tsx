'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, BarChart3, MessageSquare, TrendingUp, Users, AlertTriangle, ThumbsUp, ThumbsDown, Minus, FileText } from 'lucide-react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceAngry, faFaceFrown, faFaceMeh, faFaceSmile, faFaceGrinStars, faFaceSadTear, faFaceGrin } from '@fortawesome/free-solid-svg-icons';

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

export default function TerminalPanelDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/terminal-panel/dashboard');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⌛</div>
          <p className="text-muted-foreground">Carregando estatísticas...</p>
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

  const { npsScore, promoters = 0, passives = 0, detractors = 0, totalResponses } = analytics;
  const hasNPS = npsScore !== null;

  const npsPercentages = hasNPS && totalResponses > 0 ? {
    promoters: ((promoters / totalResponses) * 100).toFixed(1),
    passives: ((passives / totalResponses) * 100).toFixed(1),
    detractors: ((detractors / totalResponses) * 100).toFixed(1),
  } : { promoters: '0', passives: '0', detractors: '0' };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard do Terminal
        </h1>
        <p className="text-muted-foreground mt-2">
          Campanha: {analytics.campaign.title}
        </p>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Respostas coletadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.overallAvg.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De 5.0 possíveis (excl. NPS)
            </p>
          </CardContent>
        </Card>

        {hasNPS && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{npsScore?.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Net Promoter Score
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* NPS Detalhado */}
      {hasNPS && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise NPS
            </CardTitle>
            <CardDescription>
              Distribuição de promotores, neutros e detratores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Promotores */}
              <div className="p-6 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Promotores (9-10)</span>
                  <FontAwesomeIcon icon={faFaceSmile} className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-2">
                  {npsPercentages.promoters}%
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 mb-3">
                  {promoters} respostas
                </div>
                <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${npsPercentages.promoters}%` }}
                  />
                </div>
              </div>

              {/* Neutros */}
              <div className="p-6 rounded-lg border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Neutros (7-8)</span>
                  <FontAwesomeIcon icon={faFaceMeh} className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                  {npsPercentages.passives}%
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                  {passives} respostas
                </div>
                <div className="w-full bg-yellow-200 dark:bg-yellow-900 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full transition-all"
                    style={{ width: `${npsPercentages.passives}%` }}
                  />
                </div>
              </div>

              {/* Detratores */}
              <div className="p-6 rounded-lg border-2 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">Detratores (0-6)</span>
                  <FontAwesomeIcon icon={faFaceFrown} className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300 mb-2">
                  {npsPercentages.detractors}%
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 mb-3">
                  {detractors} respostas
                </div>
                <div className="w-full bg-red-200 dark:bg-red-900 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${npsPercentages.detractors}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas por Questão */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Análise por Questão</h2>
        {analytics.questionMetrics.map((metric) => (
          <Card key={metric.questionId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle>{metric.questionText}</CardTitle>
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
              {/* Distribuição SMILE / SIMPLE_SMILE */}
              {(metric.questionType === 'SMILE' || metric.questionType === 'SIMPLE_SMILE') && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {metric.questionType === 'SMILE' ? (
                    <>
                      {[1, 2, 3, 4, 5].map((rating) => {
                        const count = metric.distribution[rating.toString()] || 0;
                        const percentage = metric.totalAnswers > 0 ? (count / metric.totalAnswers) * 100 : 0;
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
                    </>
                  ) : (
                    <>
                      {[1, 2, 3, 4].map((rating) => {
                        const count = metric.distribution[rating.toString()] || 0;
                        const percentage = metric.totalAnswers > 0 ? (count / metric.totalAnswers) * 100 : 0;
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
                    </>
                  )}
                </div>
              )}

              {/* Distribuição NPS */}
              {metric.questionType === 'NPS' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-11 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                      const count = metric.distribution[score.toString()] || 0;
                      const percentage = metric.totalAnswers > 0 ? (count / metric.totalAnswers) * 100 : 0;
                      let colorClass = 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
                      if (score >= 7 && score <= 8) colorClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
                      if (score >= 9) colorClass = 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';

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
              )}

              {/* Distribuição SCALE */}
              {metric.questionType === 'SCALE' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{metric.scaleMinLabel || `${metric.scaleMin || 0} (Mínimo)`}</span>
                    <span>{metric.scaleMaxLabel || `${metric.scaleMax || 10} (Máximo)`}</span>
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(metric.scaleMax || 10) - (metric.scaleMin || 0) + 1}, minmax(0, 1fr))` }}>
                    {Array.from({ length: (metric.scaleMax || 10) - (metric.scaleMin || 0) + 1 }, (_, i) => i + (metric.scaleMin || 0)).map((value) => {
                      const count = metric.distribution[value.toString()] || 0;
                      const percentage = metric.totalAnswers > 0 ? (count / metric.totalAnswers) * 100 : 0;
                      return (
                        <div key={value} className="text-center">
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                            {value}
                          </div>
                          <div className="text-xs mt-1">{count}</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Distribuição CHOICE */}
              {(metric.questionType === 'SINGLE_CHOICE' || metric.questionType === 'MULTIPLE_CHOICE') && (() => {
                // Para MULTIPLE_CHOICE: base = total de SELEÇÕES feitas
                // Para SINGLE_CHOICE: base = total de PESSOAS que responderam
                const totalBase = metric.questionType === 'MULTIPLE_CHOICE' 
                  ? Object.values(metric.distribution).reduce((sum, c) => sum + (c as number), 0) 
                  : metric.totalAnswers;
                
                return (
                  <div className="space-y-3">
                    {Object.entries(metric.distribution).map(([option, count]) => {
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
                              className="h-2 rounded-full transition-all"
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
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    {metric.questionType === 'TEXT_INPUT' ? 'Comentários' : 'Alertas - Pontos de Atenção'}
                  </h4>
                  <div className="space-y-3">
                    {metric.negativeComments.map((comment, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
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
                          {metric.questionType === 'TEXT_INPUT' && (
                            <div className="flex-shrink-0">
                              <MessageSquare className="h-5 w-5 text-orange-600" />
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
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
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
                          <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
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
                    className="cursor-pointer bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                  >
                    Positivos ({analytics.sentimentAnalysis.comments.filter(c => c.sentiment === 'Positivo').length})
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                  >
                    Neutros ({analytics.sentimentAnalysis.comments.filter(c => c.sentiment === 'Neutro').length})
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                  >
                    Negativos ({analytics.sentimentAnalysis.comments.filter(c => c.sentiment === 'Negativo').length})
                  </Badge>
                </div>

                {/* Lista de comentários (mostrando até 10) */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analytics.sentimentAnalysis.comments.slice(0, 10).map((comment, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        comment.sentiment === 'Positivo'
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                          : comment.sentiment === 'Negativo'
                          ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                          : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
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
    </div>
  );
}
