'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Printer, Download, ArrowLeft, FileText, Calendar, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceSmile, faFaceMeh, faFaceFrown, faFaceSadTear, faFaceGrin, faChartColumn } from '@fortawesome/free-solid-svg-icons';

interface QuestionMetric {
  questionId: string;
  questionText: string;
  questionType: string;
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
    'TEXT_INPUT': 'Texto Aberto'
  };
  return labels[type] || type;
};

const getScoreColor = (score: number, type: string) => {
  if (type === 'SMILE') {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  } else if (type === 'SIMPLE_SMILE') {
    if (score >= 3.5) return 'text-green-600';
    if (score >= 2.5) return 'text-lime-600';
    if (score >= 1.5) return 'text-yellow-600';
    return 'text-red-600';
  } else if (type === 'NPS') {
    if (score >= 9) return 'text-green-600';
    if (score >= 7) return 'text-yellow-600';
    return 'text-red-600';
  } else if (type === 'SCALE') {
    const mid = 5;
    if (score >= mid + 2) return 'text-green-600';
    if (score >= mid) return 'text-yellow-600';
    return 'text-red-600';
  }
  return 'text-gray-600';
};

interface Terminal {
  id: string;
  name: string;
  email: string;
  campaignId: string;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = params.campaignId as string;
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(searchParams.get('days') || '30');
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [userLogoUrl, setUserLogoUrl] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchTerminals();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (campaignId) {
      fetchAnalytics();
    }
  }, [campaignId, dateFilter, customDateRange, selectedTerminalId]);

  const fetchTerminals = async () => {
    try {
      const response = await fetch('/api/terminals');
      const data = await response.json();
      setTerminals(data ?? []);
    } catch (error) {
      console.error('Error fetching terminals:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      const data = await response.json();
      setUserProfile(data);
      if (data.logoUrl) {
        setUserLogoUrl(data.logoUrl);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Construir URL com parâmetros
      const params = new URLSearchParams();
      
      if (isCustomRange && customDateRange?.from && customDateRange?.to) {
        params.append('startDate', format(customDateRange.from, 'yyyy-MM-dd'));
        params.append('endDate', format(customDateRange.to, 'yyyy-MM-dd'));
      } else if (!isCustomRange) {
        params.append('days', dateFilter);
      }
      
      if (selectedTerminalId && selectedTerminalId !== 'all') {
        params.append('terminalId', selectedTerminalId);
      }
      
      const url = `/api/analytics/${campaignId}?${params.toString()}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data.questionMetrics?.map((m: any) => ({
          questionId: m.questionId,
          type: m.questionType,
          distribution: m.distribution
        })));
        setAnalytics(data);
      } else {
        toast.error('Erro ao carregar dados da campanha');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomRange(true);
      setDateFilter('custom');
    } else {
      setIsCustomRange(false);
      setDateFilter(value);
    }
  };

  const handleCustomDateRangeChange = (range: DateRange | undefined) => {
    setCustomDateRange(range);
  };

  const getPeriodLabel = () => {
    if (isCustomRange && customDateRange?.from && customDateRange?.to) {
      return `${format(customDateRange.from, 'dd/MM/yyyy')} - ${format(customDateRange.to, 'dd/MM/yyyy')}`;
    }
    switch (dateFilter) {
      case '7': return 'Últimos 7 dias';
      case '30': return 'Últimos 30 dias';
      case '90': return 'Últimos 90 dias';
      case '365': return 'Todo o período';
      case 'custom': return 'Intervalo Personalizado';
      default: return 'Últimos 30 dias';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    toast.info('Use o botão Imprimir e escolha "Salvar como PDF" na janela de impressão');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleExportCSV = () => {
    if (!analytics) return;

    // Criar cabeçalhos do CSV
    const headers = ['Pergunta', 'Tipo', 'Métrica', 'Valor'];
    const rows: string[][] = [headers];

    // Adicionar dados gerais
    rows.push(['Campanha', analytics.campaign.title, 'Total de Respondentes', analytics.totalResponses.toString()]);
    rows.push(['', '', 'Média Geral', analytics.overallAvg?.toFixed(2) ?? 'N/A']);
    if (analytics.npsScore !== null) {
      rows.push(['', '', 'NPS Score', analytics.npsScore.toString()]);
    }
    rows.push(['', '', '', '']); // Linha em branco

    // Adicionar dados por pergunta
    analytics.questionMetrics.forEach((metric: QuestionMetric) => {
      rows.push([metric.questionText, getQuestionTypeLabel(metric.questionType), 'Total de Respostas', (metric.totalAnswers ?? 0).toString()]);
      
      if (metric.avgRating !== null && metric.avgRating !== undefined) {
        rows.push(['', '', 'Média', metric.avgRating.toFixed(2)]);
      }

      // Adicionar distribuição de respostas
      if (metric.distribution) {
        Object.entries(metric.distribution).forEach(([key, count]) => {
          const total = metric.totalAnswers ?? 0;
          const percentage = total > 0 ? ((count as number) / total * 100).toFixed(1) : '0';
          rows.push(['', '', `Opção: ${key}`, `${count} (${percentage}%)`]);
        });
      }

      rows.push(['', '', '', '']); // Linha em branco entre perguntas
    });

    // Adicionar dados por colaborador
    if (analytics.employeeMetrics && analytics.employeeMetrics.length > 0) {
      rows.push(['AVALIAÇÃO POR COLABORADOR', '', '', '']);
      rows.push(['', '', '', '']);
      
      analytics.employeeMetrics.forEach((employee) => {
        rows.push(['Colaborador', employee.employeeName, 'Total de Avaliações', employee.totalResponses.toString()]);
        
        employee.ratings.forEach((rating) => {
          rows.push(['', rating.questionText, 'Média', rating.avgRating.toFixed(2)]);
          rows.push(['', '', 'Total', rating.totalRatings.toString()]);
          
          rating.distribution.forEach((item) => {
            rows.push(['', '', `${item.label}`, `${item.count} (${item.percentage.toFixed(1)}%)`]);
          });
        });
        
        rows.push(['', '', '', '']); // Linha em branco entre colaboradores
      });
    }

    // Adicionar comentários
    if (analytics.allComments && analytics.allComments.length > 0) {
      rows.push(['COMENTÁRIOS', '', '', '']);
      rows.push(['Pergunta', 'Resposta', 'Comentário', 'Data']);
      
      analytics.allComments.forEach((comment) => {
        const dateStr = new Date(comment.date).toLocaleString('pt-BR');
        rows.push([
          comment.questionText,
          comment.answerText,
          comment.comment,
          dateStr
        ]);
      });
    }

    // Converter para CSV
    const csvContent = rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Criar e baixar arquivo
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const filename = `relatorio_${analytics.campaign.title.replace(/\s+/g, '_')}_${dateStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exportado com sucesso!');
  };

  const handleExportExcel = () => {
    if (!analytics) return;

    const wb = XLSX.utils.book_new();
    const wsData: any[][] = [];

    // Cabeçalho
    wsData.push([`${analytics.campaign.title} - ${new Date().toLocaleDateString('pt-BR')}`]);
    wsData.push(['Administrador']);
    wsData.push(['Período (Inicial)', 'Período (Final)']);
    
    // Período
    if (isCustomRange && customDateRange?.from && customDateRange?.to) {
      wsData.push([
        format(customDateRange.from, 'dd/MM/yyyy'),
        format(customDateRange.to, 'dd/MM/yyyy')
      ]);
    } else {
      wsData.push([getPeriodLabel(), '']);
    }
    wsData.push([]);

    // Se houver dados NPS, adicionar tabela NPS
    if (analytics.npsScore !== null && analytics.promoters !== undefined) {
      wsData.push(['ANÁLISE NPS']);
      wsData.push(['Categoria', 'Engajamento', 'Percentual %']);
      
      // Calcular total de respostas NPS (soma de todas as categorias)
      const totalNpsResponses = analytics.promoters + (analytics.passives || 0) + (analytics.detractors || 0);
      const promotersPercent = totalNpsResponses > 0 ? ((analytics.promoters / totalNpsResponses) * 100).toFixed(2) + '%' : '0.00%';
      const passivesPercent = totalNpsResponses > 0 ? (((analytics.passives || 0) / totalNpsResponses) * 100).toFixed(2) + '%' : '0.00%';
      const detractorsPercent = totalNpsResponses > 0 ? (((analytics.detractors || 0) / totalNpsResponses) * 100).toFixed(2) + '%' : '0.00%';
      
      wsData.push(['Promotores', analytics.promoters, promotersPercent]);
      wsData.push(['Neutros', analytics.passives || 0, passivesPercent]);
      wsData.push(['Detratores', analytics.detractors || 0, detractorsPercent]);
      wsData.push([]);
      
      wsData.push(['SUA NOTA NPS', analytics.npsScore.toFixed(2) + '%']);
      
      // Classificação NPS
      let reputacao = 'Crítica';
      if (analytics.npsScore > 75) reputacao = 'Excelência';
      else if (analytics.npsScore > 50) reputacao = 'Qualidade';
      else if (analytics.npsScore > 0) reputacao = 'Aperfeiçoada';
      
      wsData.push(['SUA REPUTAÇÃO', reputacao]);
      wsData.push([]);
      
      wsData.push(['Nota:', 'Zona:']);
      wsData.push(['-100 a 0', 'Crítica']);
      wsData.push(['1 a 50', 'Aperfeiçoada']);
      wsData.push(['51 a 75', 'Qualidade']);
      wsData.push(['76 a 100', 'Excelência']);
      wsData.push([]);
      wsData.push(['Cálculo NPS: (% PROMOTORES - % DETRATORES)']);
      wsData.push([]);
    }

    // Resumo Geral
    wsData.push(['RESUMO GERAL']);
    wsData.push(['Total de Respondentes', analytics.totalResponses]);
    wsData.push(['Média Geral', analytics.overallAvg?.toFixed(2) ?? 'N/A']);
    wsData.push([]);

    // Análise por Pergunta
    wsData.push(['ANÁLISE POR PERGUNTA']);
    wsData.push([]);
    
    analytics.questionMetrics.forEach((metric: QuestionMetric) => {
      wsData.push([metric.questionText]);
      wsData.push(['Tipo', getQuestionTypeLabel(metric.questionType)]);
      wsData.push(['Total de Respostas', metric.totalAnswers ?? 0]);
      
      if (metric.avgRating !== null && metric.avgRating !== undefined) {
        wsData.push(['Média', metric.avgRating.toFixed(2)]);
      }

      if (metric.distribution) {
        wsData.push([]);
        wsData.push(['Opção', 'Quantidade', 'Percentual']);
        Object.entries(metric.distribution).forEach(([key, count]) => {
          const total = metric.totalAnswers ?? 0;
          const percentage = total > 0 ? ((count as number) / total * 100).toFixed(1) + '%' : '0%';
          wsData.push([key, count, percentage]);
        });
      }
      
      wsData.push([]);
    });

    // Avaliação por Colaborador
    if (analytics.employeeMetrics && analytics.employeeMetrics.length > 0) {
      wsData.push(['AVALIAÇÃO POR COLABORADOR']);
      wsData.push([]);
      
      analytics.employeeMetrics.forEach((employee) => {
        wsData.push(['Colaborador:', employee.employeeName]);
        wsData.push(['Total de Avaliações:', employee.totalResponses]);
        
        employee.ratings.forEach((rating) => {
          wsData.push([]);
          wsData.push(['Pergunta:', rating.questionText]);
          wsData.push(['Média:', rating.avgRating.toFixed(2)]);
          wsData.push(['Total de Respostas:', rating.totalRatings]);
          wsData.push(['Distribuição:']);
          wsData.push(['Opção', 'Quantidade', 'Percentual']);
          
          rating.distribution.forEach((item) => {
            wsData.push([item.label, item.count, item.percentage.toFixed(1) + '%']);
          });
        });
        
        wsData.push([]);
        wsData.push([]);
      });
    }

    // Comentários
    if (analytics.allComments && analytics.allComments.length > 0) {
      wsData.push(['COMENTÁRIOS']);
      wsData.push(['Pergunta', 'Resposta', 'Comentário', 'Data']);
      
      analytics.allComments.forEach((comment) => {
        const dateStr = new Date(comment.date).toLocaleString('pt-BR');
        wsData.push([
          comment.questionText,
          comment.answerText,
          comment.comment,
          dateStr
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const filename = `relatorio_${analytics.campaign.title.replace(/\s+/g, '_')}_${dateStr}.xlsx`;
    
    XLSX.writeFile(wb, filename);
    toast.success('Excel exportado com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar dados da campanha</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="print:hidden">
        <Navbar />
      </div>
      
      {/* Barra de ações - oculta na impressão */}
      <div className="print:hidden bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          {/* Layout responsivo: coluna em mobile, linha em desktop */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Filtros de período e terminal */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="365">Todo o período</SelectItem>
                    <SelectItem value="custom">Intervalo Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todos os terminais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os terminais</SelectItem>
                  {terminals
                    ?.filter(t => t.campaignId === campaignId)
                    ?.map((terminal) => (
                      <SelectItem key={terminal.id} value={terminal.id}>
                        {terminal.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {isCustomRange && (
                <DateRangePicker
                  value={customDateRange as DateRange}
                  onChange={handleCustomDateRangeChange}
                  className="w-full sm:w-auto"
                />
              )}
            </div>
            
            {/* Botões de ação */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-sm"
                variant="outline"
                size="sm"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </Button>
              <Button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 text-sm"
                variant="outline"
                size="sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 text-sm"
                variant="outline"
                size="sm"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo do relatório */}
      <div className="container mx-auto px-4 py-8 max-w-7xl print:px-0 print:py-0 flex-grow">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg print:shadow-none print:rounded-none">
          {/* Cabeçalho do Relatório */}
          <div className="p-6 border-b dark:border-gray-700 print:break-after-avoid">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Relatório de Satisfação</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{analytics.campaign.title}</p>
                </div>
              </div>
              <div className="relative h-10 w-32">
                <Image 
                  src={userLogoUrl || "/logo.png"} 
                  alt={userLogoUrl ? "Logo da Empresa" : "Back&end Logo"} 
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            
            {/* Dados do Usuário/Empresa */}
            {userProfile && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Informações da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {userProfile.companyName && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Empresa:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{userProfile.companyName}</span>
                    </div>
                  )}
                  {userProfile.responsiblePerson && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Responsável:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{userProfile.responsiblePerson}</span>
                    </div>
                  )}
                  {userProfile.cnpj && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">CNPJ:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{userProfile.cnpj}</span>
                    </div>
                  )}
                  {userProfile.email && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">E-mail:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{userProfile.email}</span>
                    </div>
                  )}
                  {userProfile.city && userProfile.state && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Localização:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{userProfile.city} - {userProfile.state}</span>
                    </div>
                  )}
                  {userProfile.planType && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Plano:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{userProfile.planType}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-4">
              <span>Gerado em: {new Date().toLocaleString('pt-BR')}</span>
              <span>•</span>
              <span>Total de Respostas: {analytics.totalResponses}</span>
              <span>•</span>
              <span>Período: {getPeriodLabel()}</span>
            </div>
          </div>

          {/* Resumo Executivo */}
          <div className="p-6 border-b dark:border-gray-700 print:break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Resumo Executivo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-gray-600">Total de Respondentes</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalResponses}</div>
                </CardContent>
              </Card>

              {analytics.overallAvg > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-gray-600">Média Geral</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.overallAvg?.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              )}

              {analytics.npsScore !== null && analytics.npsScore !== undefined && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-gray-600">NPS Score</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`text-2xl font-bold ${
                      analytics.npsScore >= 50 ? 'text-green-600' :
                      analytics.npsScore >= 0 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analytics.npsScore.toFixed(0)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Análise NPS Detalhada */}
          {analytics.npsScore !== null && analytics.promoters !== undefined && (
            <div className="p-6 border-b dark:border-gray-700 print:break-inside-avoid">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartColumn} className="w-5 h-5 text-blue-600" />
                Análise NPS
              </h2>
              
              {/* Cards Visuais de Promotores, Neutros e Detratores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(() => {
                  const totalNps = analytics.promoters + (analytics.passives || 0) + (analytics.detractors || 0);
                  const promotersPercent = totalNps > 0 ? ((analytics.promoters / totalNps) * 100) : 0;
                  const passivesPercent = totalNps > 0 ? (((analytics.passives || 0) / totalNps) * 100) : 0;
                  const detractorsPercent = totalNps > 0 ? (((analytics.detractors || 0) / totalNps) * 100) : 0;
                  
                  return (
                    <>
                      <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800">
                        <div className="mb-2">
                          <FontAwesomeIcon icon={faFaceSmile} className="text-4xl text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{promotersPercent.toFixed(1)}%</div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">Promotores (9-10)</p>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400">{analytics.promoters} respostas</p>
                        <div className="mt-2 h-1.5 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${promotersPercent}%` }} />
                        </div>
                      </div>
                      
                      <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-200 dark:border-yellow-800">
                        <div className="mb-2">
                          <FontAwesomeIcon icon={faFaceMeh} className="text-4xl text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{passivesPercent.toFixed(1)}%</div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">Neutros (7-8)</p>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400">{analytics.passives || 0} respostas</p>
                        <div className="mt-2 h-1.5 bg-yellow-200 dark:bg-yellow-800 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500" style={{ width: `${passivesPercent}%` }} />
                        </div>
                      </div>
                      
                      <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800">
                        <div className="mb-2">
                          <FontAwesomeIcon icon={faFaceFrown} className="text-4xl text-red-600 dark:text-red-400" />
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{detractorsPercent.toFixed(1)}%</div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">Detratores (0-6)</p>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400">{analytics.detractors || 0} respostas</p>
                        <div className="mt-2 h-1.5 bg-red-200 dark:bg-red-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${detractorsPercent}%` }} />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Tabela de Categorias */}
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Engajamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Percentual %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr className="bg-green-50 dark:bg-green-900/20">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <span className="inline-flex items-center gap-2">
                          <FontAwesomeIcon icon={faFaceSmile} className="text-green-600 dark:text-green-400" />
                          Promotores
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-semibold">{analytics.promoters}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">
                        {(() => {
                          const totalNps = analytics.promoters + (analytics.passives || 0) + (analytics.detractors || 0);
                          return totalNps > 0 ? ((analytics.promoters / totalNps) * 100).toFixed(2) : '0.00';
                        })()}%
                      </td>
                    </tr>
                    <tr className="bg-yellow-50 dark:bg-yellow-900/20">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <span className="inline-flex items-center gap-2">
                          <FontAwesomeIcon icon={faFaceMeh} className="text-yellow-600 dark:text-yellow-400" />
                          Neutros
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-semibold">{analytics.passives || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                        {(() => {
                          const totalNps = analytics.promoters + (analytics.passives || 0) + (analytics.detractors || 0);
                          return totalNps > 0 ? (((analytics.passives || 0) / totalNps) * 100).toFixed(2) : '0.00';
                        })()}%
                      </td>
                    </tr>
                    <tr className="bg-red-50 dark:bg-red-900/20">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <span className="inline-flex items-center gap-2">
                          <FontAwesomeIcon icon={faFaceFrown} className="text-red-600 dark:text-red-400" />
                          Detratores
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-semibold">{analytics.detractors || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-semibold">
                        {(() => {
                          const totalNps = analytics.promoters + (analytics.passives || 0) + (analytics.detractors || 0);
                          return totalNps > 0 ? (((analytics.detractors || 0) / totalNps) * 100).toFixed(2) : '0.00';
                        })()}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Resultado NPS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">SUA NOTA NPS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">{analytics.npsScore.toFixed(2)}%</div>
                  </CardContent>
                </Card>

                <Card className={`border-2 ${
                  analytics.npsScore > 75 ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700' :
                  analytics.npsScore > 50 ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700' :
                  analytics.npsScore > 0 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700' :
                  'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700'
                }`}>
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">SUA REPUTAÇÃO</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-4xl font-bold ${
                      analytics.npsScore > 75 ? 'text-green-600 dark:text-green-400' :
                      analytics.npsScore > 50 ? 'text-blue-600 dark:text-blue-400' :
                      analytics.npsScore > 0 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {analytics.npsScore > 75 ? '⭐ Excelência' :
                       analytics.npsScore > 50 ? '👍 Qualidade' :
                       analytics.npsScore > 0 ? '📈 Aperfeiçoada' :
                       '⚠️ Crítica'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Classificação */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Classificação NPS</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Nota</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Zona</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      <tr className="bg-red-50 dark:bg-red-900/20">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">-100 a 0</td>
                        <td className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400">Crítica</td>
                      </tr>
                      <tr className="bg-yellow-50 dark:bg-yellow-900/20">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">1 a 50</td>
                        <td className="px-4 py-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">Aperfeiçoada</td>
                      </tr>
                      <tr className="bg-blue-50 dark:bg-blue-900/20">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">51 a 75</td>
                        <td className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400">Qualidade</td>
                      </tr>
                      <tr className="bg-green-50 dark:bg-green-900/20">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">76 a 100</td>
                        <td className="px-4 py-2 text-sm font-semibold text-green-600 dark:text-green-400">Excelência</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-xs text-gray-600 dark:text-gray-400 italic">
                  Cálculo NPS: (PROMOTORES - DETRATORES) / TOTAL DE RESPONDENTES
                </p>
              </div>
            </div>
          )}

          {/* Métricas por Pergunta */}
          <div className="p-6 print:break-before">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 print:text-lg print:mb-2">Análise Detalhada por Pergunta</h2>
            <div className="space-y-6">
              {analytics.questionMetrics?.map((metric, index) => {
                const totalAnswers = metric.totalAnswers || 1;
                const distributionEntries = Object.entries(metric.distribution ?? {});
                
                return (
                  <div key={metric.questionId} className="border rounded-lg p-4 print:break-inside-avoid">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold mb-1.5">{metric.questionText}</h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline">{getQuestionTypeLabel(metric.questionType)}</Badge>
                          {(metric.questionType === 'SMILE' || metric.questionType === 'SIMPLE_SMILE' || metric.questionType === 'NPS' || metric.questionType === 'SCALE') && (
                            <Badge variant="outline" className="text-base">
                              Média: <span className={`ml-1 ${getScoreColor(metric.avgRating ?? 0, metric.questionType)}`}>
                                {metric.avgRating?.toFixed(2) ?? '0.00'}
                              </span>
                            </Badge>
                          )}
                          <Badge variant="secondary">Engajamento ({metric.totalAnswers ?? 0})</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Distribuição de Respostas */}
                    {distributionEntries.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-3 text-gray-700">Distribuição de Respostas</h4>
                        <div className="space-y-2">
                          {metric.questionType === 'SMILE' && (() => {
                            // Calcular total da distribuição (soma de todas as opções)
                            const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
                            return [
                              { icon: faFaceSadTear, label: 'Muito Insatisfeito', color: 'bg-red-500', iconColor: 'text-red-600' },
                              { icon: faFaceFrown, label: 'Insatisfeito', color: 'bg-orange-500', iconColor: 'text-orange-600' },
                              { icon: faFaceMeh, label: 'Regular', color: 'bg-yellow-500', iconColor: 'text-yellow-600' },
                              { icon: faFaceSmile, label: 'Satisfeito', color: 'bg-lime-500', iconColor: 'text-lime-600' },
                              { icon: faFaceGrin, label: 'Muito Satisfeito', color: 'bg-green-500', iconColor: 'text-green-600' },
                            ].map((item, idx) => {
                              const rating = idx + 1;
                              const count = metric.distribution[rating] || 0;
                              const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                              
                              return (
                                <div key={rating} className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 min-w-[180px]">
                                    <FontAwesomeIcon icon={item.icon} className={`text-2xl ${item.iconColor}`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                                  </div>
                                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                                    <div
                                      className={`h-full ${item.color} transition-all duration-500 rounded-full`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-900 dark:text-gray-100">
                                      {percentage.toFixed(1)}% ({count})
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()}

                          {metric.questionType === 'SIMPLE_SMILE' && (() => {
                            // Calcular total da distribuição (soma de todas as opções)
                            const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
                            return [
                              { icon: faFaceSadTear, label: 'Ruim', value: 1, color: 'bg-red-500', iconColor: 'text-red-600' },
                              { icon: faFaceMeh, label: 'Regular', value: 2, color: 'bg-yellow-500', iconColor: 'text-yellow-600' },
                              { icon: faFaceSmile, label: 'Bom', value: 3, color: 'bg-lime-500', iconColor: 'text-lime-600' },
                              { icon: faFaceGrin, label: 'Excelente', value: 4, color: 'bg-green-500', iconColor: 'text-green-600' },
                            ].map((item) => {
                              const count = metric.distribution[item.value] || 0;
                              const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                              
                              return (
                                <div key={item.value} className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 min-w-[140px]">
                                    <FontAwesomeIcon icon={item.icon} className={`text-2xl ${item.iconColor}`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                                  </div>
                                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                                    <div
                                      className={`h-full ${item.color} transition-all duration-500 rounded-full`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-900 dark:text-gray-100">
                                      {percentage.toFixed(1)}% ({count})
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()}

                          {metric.questionType === 'TEXT_INPUT' && (
                            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                              Pergunta aberta - Respostas mostradas abaixo
                            </div>
                          )}

                          {metric.questionType === 'NPS' && (() => {
                            // Calcular total da distribuição (soma de todas as opções)
                            const totalDistribution = Object.values(metric.distribution || {}).reduce((sum, c) => sum + (c as number), 0);
                            return Array.from({ length: 11 }, (_, i) => {
                              const rating = i;
                              const count = metric.distribution[rating] || 0;
                              const percentage = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                              const bgColor = rating <= 6 ? 'bg-red-500' : rating <= 8 ? 'bg-yellow-500' : 'bg-green-500';
                              
                              return (
                                <div key={rating} className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 min-w-[60px]">
                                    <span className={`w-8 h-8 rounded-lg ${bgColor} text-white flex items-center justify-center font-bold text-sm`}>
                                      {rating}
                                    </span>
                                  </div>
                                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                                    <div
                                      className={`h-full ${bgColor} transition-all duration-500 rounded-full`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                                      {percentage.toFixed(1)}% ({count})
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()}

                          {(metric.questionType === 'SINGLE_CHOICE' || metric.questionType === 'MULTIPLE_CHOICE') && (() => {
                            // Para MULTIPLE_CHOICE: base = total de SELEÇÕES feitas
                            // Para SINGLE_CHOICE: base = total de PESSOAS que responderam
                            const totalBase = metric.questionType === 'MULTIPLE_CHOICE' 
                              ? distributionEntries.reduce((sum, [, c]) => sum + (c as number), 0) 
                              : metric.totalAnswers;
                            
                            return distributionEntries.map(([option, count], idx) => {
                              const percentage = totalBase > 0 ? ((count as number) / totalBase) * 100 : 0;
                              const customColor = metric.optionColors?.[option]?.color || '#3b82f6';
                              
                              return (
                                <div key={option} className="flex items-center gap-3">
                                  <div className="w-40 text-sm font-medium truncate">{option}</div>
                                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                                    <div
                                      className="h-full transition-all duration-500 rounded-full"
                                      style={{ width: `${percentage}%`, backgroundColor: customColor }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                                      {percentage.toFixed(1)}% ({count as number})
                                    </span>
                                  </div>
                                </div>
                              );
            });
                          })()}

                          {metric.questionType === 'SCALE' && (() => {
                            // Calcular total da distribuição (soma de todas as opções)
                            const totalDistribution = distributionEntries.reduce((sum, [, c]) => sum + (c as number), 0);
                            return distributionEntries.map(([rating, count], idx) => {
                              const percentage = totalDistribution > 0 ? ((count as number) / totalDistribution) * 100 : 0;
                              const ratingNum = parseInt(rating);
                              const maxRating = Math.max(...distributionEntries.map(([r]) => parseInt(r)));
                              const colorIntensity = Math.round((ratingNum / maxRating) * 5);
                              const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
                              
                              // Determinar label para este rating
                              const getLabel = () => {
                                if (metric.scaleMin !== undefined && metric.scaleMax !== undefined) {
                                  if (ratingNum === metric.scaleMin && metric.scaleMinLabel) {
                                    return metric.scaleMinLabel;
                                  }
                                  if (ratingNum === metric.scaleMax && metric.scaleMaxLabel) {
                                    return metric.scaleMaxLabel;
                                  }
                                }
                                return '';
                              };
                              
                              const label = getLabel();
                              
                              return (
                                <div key={rating} className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 min-w-[120px]">
                                    <span className="w-8 h-8 text-sm font-bold flex items-center justify-center">
                                      {rating}
                                    </span>
                                    {label && (
                                      <span className="text-xs text-gray-600 font-medium">
                                        {label}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                                    <div
                                      className={`h-full ${colors[Math.min(colorIntensity, 4)]} transition-all duration-500 rounded-full`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                                      {percentage.toFixed(1)}% ({count as number})
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Alertas - Pontos de Atenção */}
                    {metric.negativeComments && metric.negativeComments.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                          <span className="text-lg">⚠️</span>
                          {metric.questionType === 'SINGLE_CHOICE' || metric.questionType === 'MULTIPLE_CHOICE'
                            ? `Comentários (${metric.negativeComments.length})`
                            : `Alertas - Pontos de Atenção (${metric.negativeComments.length})`}
                        </div>
                        <div className="space-y-2">
                          {metric.negativeComments?.slice(0, 3)?.map((comment: any, idx: number) => (
                            <div key={idx} className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                {metric.questionType === 'SMILE' && comment.rating !== null && comment.rating <= 5 && (
                                  <FontAwesomeIcon 
                                    icon={
                                      comment.rating === 1 ? faFaceSadTear : 
                                      comment.rating === 2 ? faFaceFrown : 
                                      comment.rating === 3 ? faFaceMeh : 
                                      comment.rating === 4 ? faFaceSmile : 
                                      faFaceGrin
                                    } 
                                    className={`text-2xl ${
                                      comment.rating === 1 ? 'text-red-600' : 
                                      comment.rating === 2 ? 'text-orange-600' : 
                                      comment.rating === 3 ? 'text-yellow-600' : 
                                      comment.rating === 4 ? 'text-lime-600' : 
                                      'text-green-600'
                                    }`}
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
                                    className={`text-2xl ${
                                      comment.rating === 1 ? 'text-red-600' : 
                                      comment.rating === 2 ? 'text-yellow-600' : 
                                      comment.rating === 3 ? 'text-lime-600' : 
                                      'text-green-600'
                                    }`}
                                  />
                                )}
                                {metric.questionType === 'TEXT_INPUT' && (
                                  <FontAwesomeIcon icon={faFaceSmile} className="text-2xl text-gray-600" />
                                )}
                                {metric.questionType === 'NPS' && comment.rating !== null && (
                                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                                    comment.rating <= 6 ? 'bg-red-500' : comment.rating <= 8 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}>
                                    {comment.rating}
                                  </span>
                                )}
                                {metric.questionType === 'SCALE' && comment.rating !== null && (
                                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                                    comment.rating <= 3 ? 'bg-red-500' : comment.rating <= 7 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}>
                                    {comment.rating}
                                  </span>
                                )}
                                <div className="flex-1">
                                  <p className="text-sm text-gray-700">"{comment.comment}"</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(comment.date).toLocaleDateString('pt-BR', { 
                                      day: '2-digit', 
                                      month: 'short', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Análise de Sentimento */}
          {analytics.sentimentAnalysis && analytics.sentimentAnalysis.total > 0 && (
            <div className="p-6 border-t print:break-inside-avoid">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>📊</span> Análise de Sentimento
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Análise automática baseada em palavras-chave das respostas abertas
              </p>

              {/* Distribuição de Sentimentos */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="border rounded-lg p-3 print-card-green">
                  <div className="text-xs text-gray-600 mb-1">✅ Positivo</div>
                  <div className="text-xl font-bold text-green-600">
                    {analytics.sentimentAnalysis.positivePercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {analytics.sentimentAnalysis.positive} respostas
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-green-500"
                      style={{ width: `${analytics.sentimentAnalysis.positivePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-3 print-card-yellow">
                  <div className="text-xs text-gray-600 mb-1">➖ Neutro</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {analytics.sentimentAnalysis.neutralPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {analytics.sentimentAnalysis.neutral} respostas
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-yellow-500"
                      style={{ width: `${analytics.sentimentAnalysis.neutralPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-3 print-card-red">
                  <div className="text-xs text-gray-600 mb-1">⚠️ Negativo</div>
                  <div className="text-xl font-bold text-red-600">
                    {analytics.sentimentAnalysis.negativePercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {analytics.sentimentAnalysis.negative} respostas
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-red-500"
                      style={{ width: `${analytics.sentimentAnalysis.negativePercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Palavras-chave */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Palavras Positivas */}
                {analytics.sentimentAnalysis.topPositiveWords.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <h3 className="text-sm font-semibold mb-2 text-green-700">
                      ✅ Palavras Positivas Mais Frequentes
                    </h3>
                    <div className="space-y-1">
                      {analytics.sentimentAnalysis.topPositiveWords.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-green-600">{item.word}</span>
                          <span className="text-gray-500">{item.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Palavras Negativas */}
                {analytics.sentimentAnalysis.topNegativeWords.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <h3 className="text-sm font-semibold mb-2 text-red-700">
                      ⚠️ Palavras Negativas Mais Frequentes
                    </h3>
                    <div className="space-y-1">
                      {analytics.sentimentAnalysis.topNegativeWords.slice(0, 5).map((item, index) => (
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
                  {analytics.sentimentAnalysis.comments.slice(0, 5).map((comment, index) => (
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
            </div>
          )}

          {/* Métricas por Colaborador */}
          {analytics.employeeMetrics && analytics.employeeMetrics.length > 0 && (
            <div className="p-8 border-t dark:border-gray-700 print:break-before">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 print:text-xl print:mb-3">
                <FontAwesomeIcon icon={faChartColumn} className="text-orange-600" />
                Avaliação por Colaborador
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 print:text-xs print:mb-3">
                Desempenho individual de cada colaborador baseado nas avaliações dos clientes
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-3">
                {analytics.employeeMetrics.map((employee) => (
                  <Card key={employee.employeeId} className="print-card print:break-inside-avoid">
                    <CardHeader className="pb-3 print:pb-1">
                      <div className="flex items-center gap-3 print:gap-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0 print:w-8 print:h-8">
                          {employee.employeeImageUrl ? (
                            <Image
                              src={employee.employeeImageUrl}
                              alt={employee.employeeName}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover print:w-8 print:h-8"
                            />
                          ) : (
                            <span className="text-2xl print:text-lg">👤</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold truncate print:text-sm">
                            {employee.employeeName}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground print:text-[10px]">
                            {employee.totalResponses} {employee.totalResponses === 1 ? 'avaliação' : 'avaliações'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 print:pt-0">
                      {employee.ratings.map((rating) => (
                        <div key={rating.questionId} className="mb-4 last:mb-0 print:mb-2">
                          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide print:text-[9px] print:mb-1">
                            {rating.questionText}
                          </p>
                          <div className="space-y-2 print:space-y-1">
                            {rating.distribution.map((item) => (
                              <div key={item.label} className="space-y-1 print:space-y-0">
                                <div className="flex justify-between items-center text-xs print:text-[9px]">
                                  <span className="text-gray-700 dark:text-gray-300">
                                    ({item.count}) {item.label}
                                  </span>
                                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                                    {item.percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden print:h-1">
                                  <div
                                    className="h-full transition-all duration-500 rounded print:h-1"
                                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 print:mt-1 print:pt-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground print:text-[9px]">Média</span>
                              <span className="text-sm font-bold print:text-xs">
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

          {/* Comentários Principais */}
          {analytics.allComments && analytics.allComments.length > 0 && (
            <div className="p-8 border-t print:break-inside-avoid">
              <h2 className="text-2xl font-bold mb-6">Principais Comentários</h2>
              <div className="space-y-4">
                {analytics.allComments.slice(0, 10).map((commentItem, index) => (
                  <div
                    key={`${commentItem.responseId}-${commentItem.questionId}-${index}`}
                    className="border rounded-lg p-4 print:break-inside-avoid"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {getQuestionTypeLabel(commentItem.questionType)}
                      </Badge>
                      <span className="text-xs text-gray-600">
                        {new Date(commentItem.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">{commentItem.questionText}</p>
                    <p className="text-sm text-blue-600 mb-1">Resposta: {commentItem.answerText}</p>
                    <p className="text-sm text-gray-700 italic">"{commentItem.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
