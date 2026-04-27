import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { analyzeSentimentBatch } from '@/lib/sentiment-analysis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const daysParam = searchParams.get('days');
    const viewAsUserId = searchParams.get('viewAsUser');
    const terminalId = searchParams.get('terminalId');

    // Buscar campanha com perguntas e opções
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.campaignId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    // Verificar permissão: usuário deve ser dono da campanha OU admin visualizando como outro usuário
    const isOwner = campaign.userId === user.id;
    const isAdminViewing = user.role === 'ADMIN' && viewAsUserId === campaign.userId;
    
    if (!isOwner && !isAdminViewing) {
      return NextResponse.json({ error: 'Sem permissão para acessar esta campanha' }, { status: 403 });
    }

    // Filtro de data com ajuste de timezone
    const dateFilter: any = { campaignId: params.campaignId };
    
    // Filtro por terminal específico
    if (terminalId && terminalId !== 'all') {
      dateFilter.terminalId = terminalId;
    }
    
    // Se "days" foi especificado, calcular a data inicial
    if (daysParam && daysParam !== '365') {
      const days = parseInt(daysParam);
      const startDateCalc = new Date();
      startDateCalc.setHours(0, 0, 0, 0); // Início do dia atual
      startDateCalc.setDate(startDateCalc.getDate() - days);
      dateFilter.createdAt = { gte: startDateCalc };
    }
    // Senão, usar startDate e endDate se fornecidos
    else if (startDate && endDate) {
      // Criar data de início no começo do dia (00:00:00)
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      // Criar data de fim no final do dia (23:59:59.999)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter.createdAt = {
        gte: start,
        lte: end
      };
    }
    else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { gte: start };
    }
    else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { lte: end };
    }

    // Buscar todas as respostas
    const responses = await prisma.response.findMany({
      where: dateFilter,
      include: {
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalResponses = responses.length;

    // Calcular métricas por pergunta
    const questionMetrics = campaign.questions.map((question: any) => {
      const answers = responses.flatMap((r: any) => r.answers.filter((a: any) => a.questionId === question.id));
      const totalAnswers = answers.length;

      let avgRating = 0;
      let distribution: any = {};
      let optionDetails: any = {};
      let negativeComments: any[] = [];

      // Métricas diferentes por tipo de pergunta
      if (question.type === 'SMILE' || question.type === 'SIMPLE_SMILE' || question.type === 'NPS' || question.type === 'SCALE') {
        // Para perguntas com rating
        const ratings = answers.map((a: any) => a.rating).filter((r: any) => r !== null);
        avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

        // Distribuição de respostas
        ratings.forEach((rating: number) => {
          const ratingNum = Number(rating);
          if (!isNaN(ratingNum)) {
            distribution[ratingNum] = (distribution[ratingNum] || 0) + 1;
          }
        });

        // Comentários negativos
        const threshold = question.type === 'SMILE' ? 2 : question.type === 'SIMPLE_SMILE' ? 2 : question.type === 'NPS' ? 6 : (question.scaleMin || 1) + 1;
        negativeComments = answers
          .filter((a: any) => a.rating !== null && a.rating <= threshold && a.comment)
          .map((a: any) => ({
            rating: a.rating,
            comment: a.comment,
            date: responses.find((r: any) => r.id === a.responseId)?.createdAt,
          }))
          .slice(0, 5);
      } else if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE' || question.type === 'EMPLOYEE_RATING') {
        // Para perguntas de escolha única, múltipla ou avaliação de colaborador
        const optionCounts: any = {};
        
        // Conta quantas vezes cada opção foi selecionada
        answers.forEach((a: any) => {
          const selectedOptionIds = a.selectedOptions || [];
          selectedOptionIds.forEach((optId: string) => {
            const option = question.options.find((o: any) => o.id === optId);
            if (option) {
              optionCounts[option.text] = (optionCounts[option.text] || 0) + 1;
              if (!optionDetails[option.text]) {
                optionDetails[option.text] = { 
                  color: option.color || '#f97316',
                  imageUrl: option.imageUrl || null
                };
              }
            }
          });
        });

        distribution = optionCounts;

        // Comentários (todos, já que não há "negativos" para múltipla escolha)
        negativeComments = answers
          .filter((a: any) => a.comment)
          .map((a: any) => ({
            rating: null,
            comment: a.comment,
            date: responses.find((r: any) => r.id === a.responseId)?.createdAt,
            selectedOptions: a.selectedOptions,
          }))
          .slice(0, 5);
      } else if (question.type === 'TEXT_INPUT') {
        // Para perguntas abertas (texto livre)
        // Apenas coletamos todos os comentários como respostas
        negativeComments = answers
          .filter((a: any) => a.comment && a.comment.trim())
          .map((a: any) => ({
            rating: null,
            comment: a.comment,
            date: responses.find((r: any) => r.id === a.responseId)?.createdAt,
          }))
          .slice(0, 10); // Mostra até 10 respostas
      }

      return {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        avgRating,
        totalAnswers,
        distribution,
        optionColors: optionDetails || {},
        negativeComments,
        scaleMin: question.scaleMin,
        scaleMax: question.scaleMax,
        scaleMinLabel: question.scaleMinLabel,
        scaleMaxLabel: question.scaleMaxLabel,
      };
    });

    // Calcular média geral (apenas SMILE, SIMPLE_SMILE e SCALE - NPS tem sua própria métrica)
    const ratingQuestions = questionMetrics.filter((m: any) => 
      m.questionType === 'SMILE' || m.questionType === 'SIMPLE_SMILE' || m.questionType === 'SCALE'
    );
    const overallAvg = ratingQuestions.length > 0
      ? ratingQuestions.reduce((sum: number, m: any) => sum + m.avgRating, 0) / ratingQuestions.length
      : 0;

    // Calcular NPS se houver perguntas NPS
    let npsScore: number | null = null;
    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    
    const npsQuestions = questionMetrics.filter((m: any) => m.questionType === 'NPS');
    if (npsQuestions.length > 0) {
      const allNpsRatings = responses.flatMap((r: any) =>
        r.answers
          .filter((a: any) => {
            const q = campaign.questions.find((qu: any) => qu.id === a.questionId);
            return q && q.type === 'NPS' && a.rating !== null;
          })
          .map((a: any) => a.rating)
      );

      if (allNpsRatings.length > 0) {
        // Retornar QUANTIDADES (para compatibilidade com página de relatórios)
        promoters = allNpsRatings.filter((r: number) => r >= 9).length;
        passives = allNpsRatings.filter((r: number) => r >= 7 && r <= 8).length;
        detractors = allNpsRatings.filter((r: number) => r <= 6).length;
        
        // NPS Score = (% Promotores - % Detratores)
        const promotersPercent = (promoters / allNpsRatings.length) * 100;
        const detractorsPercent = (detractors / allNpsRatings.length) * 100;
        npsScore = promotersPercent - detractorsPercent;
      }
    }

    // Respostas ao longo do tempo
    const responsesOverTime = responses.reduce((acc: any, response: any) => {
      const date = new Date(response.createdAt).toLocaleDateString('pt-BR');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Histórico completo de comentários com perguntas e respostas
    const allComments = responses.flatMap((response: any) =>
      response.answers
        .filter((answer: any) => answer.comment && answer.comment.trim() !== '')
        .map((answer: any) => {
          const question = campaign.questions.find((q: any) => q.id === answer.questionId);
          
          let answerText = '';
          if (answer.rating !== null && answer.rating !== undefined) {
            // Para perguntas com rating (SMILE, NPS, SCALE)
            answerText = `Nota: ${answer.rating}`;
          } else if (answer.selectedOptions && answer.selectedOptions.length > 0 && question?.options) {
            // Para perguntas de múltipla escolha
            const selectedOptionsText = answer.selectedOptions
              .map((optId: string) => {
                const option = question.options.find((o: any) => o.id === optId);
                return option ? option.text : '';
              })
              .filter(Boolean)
              .join(', ');
            answerText = selectedOptionsText || 'Sem seleção';
          } else {
            answerText = 'Sem resposta';
          }

          return {
            responseId: response.id,
            questionId: answer.questionId,
            questionText: question?.text || 'Pergunta não encontrada',
            questionType: question?.type || 'UNKNOWN',
            answerText,
            rating: answer.rating,
            selectedOptions: answer.selectedOptions,
            comment: answer.comment,
            date: response.createdAt,
          };
        })
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ========== ANÁLISE DE SENTIMENTO (TODOS os comentários) ==========
    // Buscar palavras-chave customizadas do usuário
    const userKeywords = await prisma.sentimentKeyword.findMany({
      where: { userId: campaign.userId },
    });

    const customPositiveWords = userKeywords
      .filter((k: any) => k.type === 'POSITIVE')
      .map((k: any) => k.word);
    
    const customNegativeWords = userKeywords
      .filter((k: any) => k.type === 'NEGATIVE')
      .map((k: any) => k.word);

    // Coletar TODOS os comentários (TEXT_INPUT + comentários opcionais de todas as perguntas)
    const allTextComments = responses.flatMap((response: any) => 
      response.answers
        .filter((answer: any) => answer.comment && answer.comment.trim() !== '')
        .map((answer: any) => answer.comment)
    );

    const sentimentAnalysis = analyzeSentimentBatch(
      allTextComments,
      customPositiveWords,
      customNegativeWords
    );

    // Calcular métricas por colaborador (para perguntas EMPLOYEE_RATING + avaliação)
    const employeeMetrics: any[] = [];
    
    // Encontrar pergunta de seleção de colaborador
    const employeeQuestion = campaign.questions.find((q: any) => q.type === 'EMPLOYEE_RATING');
    // Encontrar perguntas de avaliação (SMILE, SIMPLE_SMILE, NPS, SCALE)
    const evalQuestions = campaign.questions.filter((q: any) => 
      q.type === 'SMILE' || q.type === 'SIMPLE_SMILE' || q.type === 'NPS' || q.type === 'SCALE'
    );
    
    // Funções auxiliares para labels dinâmicos
    const getRatingLabel = (rating: number, question: any): string => {
      const type = question.type;
      
      if (type === 'SMILE' || type === 'SIMPLE_SMILE') {
        // Mapeamento padrão de valores para labels
        const valueToLabel: { [key: number]: string } = {
          1: question.scaleMinLabel || 'Muito Insatisfeito',
          2: 'Insatisfeito',
          3: 'Regular',
          4: 'Satisfeito',
          5: question.scaleMaxLabel || 'Muito Satisfeito',
        };
        
        // Para SIMPLE_SMILE (4 opções)
        if (type === 'SIMPLE_SMILE') {
          const simpleLabels: { [key: number]: string } = {
            1: question.scaleMinLabel || 'Ruim',
            2: 'Regular',
            3: 'Bom',
            4: question.scaleMaxLabel || 'Excelente',
          };
          return simpleLabels[rating] || `${rating}`;
        }
        
        return valueToLabel[rating] || `${rating}`;
      } else if (type === 'NPS') {
        if (rating <= 6) return 'Detrator';
        if (rating <= 8) return 'Neutro';
        return 'Promotor';
      } else if (type === 'SCALE') {
        // Para escala personalizada, usar o valor numérico
        return `${rating}`;
      }
      return `${rating}`;
    };
    
    const getRatingColor = (rating: number, type: string): string => {
      if (type === 'SMILE' || type === 'SIMPLE_SMILE') {
        // Cores baseadas no valor numérico (1-5)
        const colors: { [key: number]: string } = {
          1: '#ef4444', // Vermelho
          2: '#f97316', // Laranja
          3: '#eab308', // Amarelo
          4: '#84cc16', // Verde claro
          5: '#22c55e', // Verde
        };
        return colors[rating] || '#3b82f6';
      } else if (type === 'NPS') {
        if (rating <= 6) return '#ef4444';
        if (rating <= 8) return '#eab308';
        return '#22c55e';
      }
      return '#3b82f6';
    };
    
    if (employeeQuestion && evalQuestions.length > 0) {
      // Para cada opção (colaborador) na pergunta EMPLOYEE_RATING
      employeeQuestion.options.forEach((option: any) => {
        const employeeId = option.id;
        const employeeName = option.text;
        const employeeImageUrl = option.imageUrl;
        
        // Buscar todas as respostas de AVALIAÇÃO onde este colaborador foi selecionado
        // (excluindo a própria pergunta EMPLOYEE_RATING que não tem rating)
        const answersForEmployee = responses.flatMap((r: any) => 
          r.answers.filter((a: any) => {
            const question = campaign.questions.find((q: any) => q.id === a.questionId);
            // Verifica tanto selectedEmployeeId quanto selectedOptions (array)
            const hasEmployeeInOptions = a.selectedOptions && a.selectedOptions.includes(employeeId);
            return (a.selectedEmployeeId === employeeId || hasEmployeeInOptions) && 
                   question && 
                   (question.type === 'SMILE' || question.type === 'SIMPLE_SMILE' || question.type === 'NPS' || question.type === 'SCALE');
          })
        );
        
        if (answersForEmployee.length > 0) {
          // Para cada pergunta de avaliação, calcular métricas
          const employeeRatings = evalQuestions.map((ratingQ: any) => {
            const ratingAnswers = answersForEmployee.filter((a: any) => a.questionId === ratingQ.id);
            const ratings = ratingAnswers.map((a: any) => a.rating).filter((r: any) => r !== null);
            
            if (ratings.length === 0) return null;
            
            // Calcular distribuição
            const distribution: any = {};
            const ratingDetails: { rating: number; label: string; color: string }[] = [];
            
            ratings.forEach((rating: number) => {
              const label = getRatingLabel(rating, ratingQ);
              const color = getRatingColor(rating, ratingQ.type);
              distribution[label] = (distribution[label] || 0) + 1;
              ratingDetails.push({ rating, label, color });
            });
            
            // Converter para array ordenado
            const distributionArray = Object.entries(distribution).map(([label, count]) => {
              // Encontrar a cor correspondente a este label
              const detail = ratingDetails.find(r => r.label === label);
              return {
                label,
                count: count as number,
                percentage: ((count as number) / ratings.length) * 100,
                color: detail?.color || '#3b82f6',
              };
            }).sort((a, b) => b.count - a.count);
            
            return {
              questionId: ratingQ.id,
              questionText: ratingQ.text,
              questionType: ratingQ.type,
              totalRatings: ratings.length,
              avgRating: ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length,
              distribution: distributionArray,
            };
          }).filter(Boolean);
          
          if (employeeRatings.length > 0) {
            // Contar quantas pesquisas (responses) diferentes avaliaram este colaborador
            const uniqueResponses = new Set(
              answersForEmployee.map((a: any) => {
                const response = responses.find((r: any) => 
                  r.answers.some((ans: any) => ans.id === a.id)
                );
                return response?.id;
              }).filter(Boolean)
            );
            
            employeeMetrics.push({
              employeeId,
              employeeName,
              employeeImageUrl,
              totalResponses: uniqueResponses.size,
              ratings: employeeRatings,
            });
          }
        }
      });
    }

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        title: campaign.title,
      },
      totalResponses,
      overallAvg,
      npsScore,
      promoters,
      passives,
      detractors,
      questionMetrics,
      responsesOverTime,
      allComments,
      sentimentAnalysis,
      employeeMetrics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Erro ao buscar analytics' }, { status: 500 });
  }
}
