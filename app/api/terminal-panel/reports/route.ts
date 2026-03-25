import { NextRequest, NextResponse } from 'next/server';
import { getTerminalSession } from '@/lib/terminal-auth';
import prisma from '@/lib/db';
import { analyzeSentimentBatch } from '@/lib/sentiment-analysis';

export const dynamic = 'force-dynamic';

// Helper para converter Answer do Prisma para formato simplificado
function getAnswerValue(answer: any, questionOptions: any[] = []): string {
  if (answer.rating !== null) {
    return answer.rating.toString();
  }

  if (answer.selectedOptions && answer.selectedOptions.length > 0) {
    const optionTexts = answer.selectedOptions
      .map((optionId: string) => {
        const option = questionOptions.find((opt) => opt.id === optionId);
        return option ? option.text : optionId;
      })
      .filter((text: string) => text);

    return optionTexts.join(', ');
  }

  return answer.comment || '';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getTerminalSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter parâmetros de filtro de data da URL
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Buscar terminal com campanhas vinculadas
    const terminal = await prisma.terminal.findUnique({
      where: { id: session.terminalId },
      include: {
        campaigns: {
          include: {
            campaign: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!terminal || terminal.campaigns.length === 0) {
      return NextResponse.json({ error: 'Terminal não encontrado' }, { status: 404 });
    }

    // Pegar a primeira campanha ativa
    const activeCampaign = terminal.campaigns[0].campaign;
    const campaignIds = terminal.campaigns.map(tc => tc.campaignId);

    // Construir filtro de data
    const dateFilter: any = {
      terminalId: session.terminalId,
      campaignId: { in: campaignIds },
    };

    if (startDateStr && endDateStr) {
      // Criar data de início no começo do dia (00:00:00)
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      
      // Criar data de fim no final do dia (23:59:59.999)
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      
      dateFilter.createdAt = {
        gte: start,
        lte: end
      };
    } else if (startDateStr) {
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { gte: start };
    } else if (endDateStr) {
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { lte: end };
    }

    // Buscar respostas do terminal com filtro de data
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular estatísticas
    let totalRatings = 0;
    let ratingCount = 0;
    let npsScores: number[] = [];

    responses.forEach((response) => {
      response.answers.forEach((answer) => {
        if (
          answer.rating !== null &&
          ['SMILE', 'SIMPLE_SMILE', 'SCALE'].includes(answer.question.type)
        ) {
          totalRatings += answer.rating;
          ratingCount++;
        }

        if (answer.question.type === 'NPS' && answer.rating !== null) {
          npsScores.push(answer.rating);
        }
      });
    });

    const overallAverage = ratingCount > 0 ? totalRatings / ratingCount : 0;

    let npsScore = 0;
    if (npsScores.length > 0) {
      const promoters = npsScores.filter((score) => score >= 9).length;
      const detractors = npsScores.filter((score) => score <= 6).length;
      npsScore = ((promoters - detractors) / npsScores.length) * 100;
    }

    // Calcular métricas por questão
    const questionMetrics = activeCampaign.questions.map((question) => {
      const answers = responses.flatMap((r) =>
        r.answers.filter((a) => a.questionId === question.id)
      );

      let avgRating = 0;
      let distribution: { [key: string]: number } = {};
      let optionDetails: { [key: string]: { color: string } } = {};
      let negativeComments: any[] = [];

      if (question.type === 'SMILE' || question.type === 'SIMPLE_SMILE' || question.type === 'NPS' || question.type === 'SCALE') {
        const ratings = answers.filter((a) => a.rating !== null).map((a) => a.rating as number);
        if (ratings.length > 0) {
          avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        }

        ratings.forEach((rating) => {
          distribution[rating.toString()] = (distribution[rating.toString()] || 0) + 1;
        });

        if (question.type === 'SMILE' || question.type === 'SIMPLE_SMILE') {
          const threshold = question.type === 'SMILE' ? 3 : 2;
          negativeComments = answers
            .filter((a) => a.rating !== null && a.rating <= threshold && a.comment)
            .map((a) => ({
              rating: a.rating,
              comment: a.comment,
              date: responses.find((r) => r.answers.some((ans) => ans.id === a.id))?.createdAt,
            }));
        }
      } else if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
        // Distribuição de opções (conta as seleções)
        answers.forEach((answer) => {
          answer.selectedOptions.forEach((optionId) => {
            const option = question.options.find((o) => o.id === optionId);
            const optionText = option?.text || optionId;
            distribution[optionText] = (distribution[optionText] || 0) + 1;
            if (option && !optionDetails[optionText]) {
              optionDetails[optionText] = { color: option.color || '#3b82f6' };
            }
          });
        });
      } else if (question.type === 'TEXT_INPUT') {
        negativeComments = answers
          .filter((a) => a.comment)
          .map((a) => ({
            comment: a.comment,
            date: responses.find((r) => r.answers.some((ans) => ans.id === a.id))?.createdAt,
          }));
      }

      return {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        avgRating,
        totalAnswers: answers.length,
        distribution,
        optionColors: optionDetails,
        negativeComments,
        scaleMin: question.scaleMin,
        scaleMax: question.scaleMax,
        scaleMinLabel: question.scaleMinLabel,
        scaleMaxLabel: question.scaleMaxLabel,
      };
    });

    // Calcular NPS detalhado
    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    if (npsScores.length > 0) {
      promoters = npsScores.filter((score) => score >= 9).length;
      passives = npsScores.filter((score) => score >= 7 && score <= 8).length;
      detractors = npsScores.filter((score) => score <= 6).length;
    }

    // Formatar respostas para o relatório
    const formattedResponses = responses.map((response) => ({
      id: response.id,
      createdAt: response.createdAt,
      respondentName: response.respondentName,
      respondentEmail: response.respondentEmail,
      respondentPhone: response.respondentPhone,
      answers: response.answers.map((answer) => {
        const question = activeCampaign.questions.find(
          (q: any) => q.id === answer.questionId
        );
        const questionOptions = question?.options || [];

        return {
          questionText: answer.question.text,
          questionType: answer.question.type,
          value: getAnswerValue(answer, questionOptions),
          comment: answer.comment,
        };
      }),
    }));

    // Coletar TODOS os comentários para seção separada
    const allComments: any[] = [];
    responses.forEach((response) => {
      response.answers.forEach((answer) => {
        if (answer.comment && answer.comment.trim()) {
          allComments.push({
            responseId: response.id,
            questionId: answer.questionId,
            questionText: answer.question.text,
            questionType: answer.question.type,
            answerText: answer.rating !== null ? answer.rating.toString() : '',
            rating: answer.rating,
            selectedOptions: answer.selectedOptions.map((optId) => {
              const opt = answer.question.options.find((o) => o.id === optId);
              return opt ? opt.text : optId;
            }),
            comment: answer.comment,
            date: response.createdAt.toISOString(),
          });
        }
      });
    });

    // ========== ANÁLISE DE SENTIMENTO (TODOS os comentários) ==========
    // Buscar palavras-chave customizadas do usuário (dono da campanha)
    const userKeywords = await prisma.sentimentKeyword.findMany({
      where: { userId: activeCampaign.userId },
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

    return NextResponse.json({
      terminalName: terminal.name,
      campaignTitle: activeCampaign.title,
      totalResponses: responses.length,
      overallAverage: overallAverage.toFixed(2),
      npsScore: npsScores.length > 0 ? npsScore.toFixed(1) : null,
      promoters,
      passives,
      detractors,
      questionMetrics,
      responses: formattedResponses,
      allComments, // Todos os comentários
      sentimentAnalysis,
    });
  } catch (error) {
    console.error('Error fetching terminal reports:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatório' },
      { status: 500 }
    );
  }
}
