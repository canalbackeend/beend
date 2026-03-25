import { NextResponse } from 'next/server';
import { getTerminalSession } from '@/lib/terminal-auth';
import prisma from '@/lib/db';
import { analyzeSentimentBatch } from '@/lib/sentiment-analysis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getTerminalSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'Terminal ou campanha não encontrados' }, { status: 404 });
    }

    // Pegar a primeira campanha ativa (ou podemos agregar todas no futuro)
    const activeCampaign = terminal.campaigns[0].campaign;
    const campaignIds = terminal.campaigns.map(tc => tc.campaignId);

    // Buscar respostas do terminal para todas as campanhas vinculadas
    const responses = await prisma.response.findMany({
      where: {
        terminalId: session.terminalId,
        campaignId: { in: campaignIds },
      },
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
    const totalResponses = responses.length;

    // Respostas nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const responsesLast7Days = responses.filter(
      (r) => new Date(r.createdAt) >= sevenDaysAgo
    ).length;

    // Respostas nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const responsesLast30Days = responses.filter(
      (r) => new Date(r.createdAt) >= thirtyDaysAgo
    ).length;

    // Respostas com dados de contato
    const responsesWithContact = responses.filter(
      (r) => r.respondentName || r.respondentEmail || r.respondentPhone
    ).length;

    // Calcular média geral (excluindo NPS)
    let totalRatings = 0;
    let ratingCount = 0;

    responses.forEach((response) => {
      response.answers.forEach((answer) => {
        if (
          answer.rating !== null &&
          ['SMILE', 'SIMPLE_SMILE', 'SCALE'].includes(answer.question.type)
        ) {
          totalRatings += answer.rating;
          ratingCount++;
        }
      });
    });

    const overallAverage = ratingCount > 0 ? totalRatings / ratingCount : 0;

    // Calcular NPS
    let npsScores: number[] = [];
    responses.forEach((response) => {
      response.answers.forEach((answer) => {
        if (answer.question.type === 'NPS' && answer.rating !== null) {
          npsScores.push(answer.rating);
        }
      });
    });

    let npsScore = 0;
    if (npsScores.length > 0) {
      const promoters = npsScores.filter((score) => score >= 9).length;
      const detractors = npsScores.filter((score) => score <= 6).length;
      npsScore = ((promoters - detractors) / npsScores.length) * 100;
    }

    // Calcular métricas por questão (usando questões da primeira campanha)
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

        // Distribuição de ratings
        ratings.forEach((rating) => {
          distribution[rating.toString()] = (distribution[rating.toString()] || 0) + 1;
        });

        // Comentários negativos (ratings baixos)
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
        // Comentários de texto aberto
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
        avgRating: avgRating,
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

    // Respostas ao longo do tempo (por dia)
    const responsesOverTimeObj: { [key: string]: number } = {};
    const last30Days: Date[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push(date);
    }

    last30Days.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      responsesOverTimeObj[dateStr] = 0;
    });

    responses.forEach((response) => {
      const dateStr = new Date(response.createdAt).toISOString().split('T')[0];
      if (responsesOverTimeObj[dateStr] !== undefined) {
        responsesOverTimeObj[dateStr]++;
      }
    });

    // Calcular promoters, passives, detractors
    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    if (npsScores.length > 0) {
      promoters = npsScores.filter((score) => score >= 9).length;
      passives = npsScores.filter((score) => score >= 7 && score <= 8).length;
      detractors = npsScores.filter((score) => score <= 6).length;
    }

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
      campaign: {
        id: activeCampaign.id,
        title: activeCampaign.title,
      },
      totalResponses,
      overallAvg: overallAverage,
      npsScore: npsScores.length > 0 ? npsScore : null,
      questionMetrics,
      responsesOverTime: responsesOverTimeObj,
      promoters,
      passives,
      detractors,
      sentimentAnalysis,
    });
  } catch (error) {
    console.error('Error fetching terminal dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
}
