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
                    options: { orderBy: { order: 'asc' } },
                  },
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

    const campaignIds = terminal.campaigns.map(tc => tc.campaignId);
    const activeCampaigns = terminal.campaigns.map(tc => tc.campaign);

    // Se tem múltiplas campanhas, agregar os dados de todas
    const hasMultipleCampaigns = campaignIds.length > 1;

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

    // Calcular NPS
    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    let npsScores: number[] = [];

    responses.forEach((response) => {
      response.answers.forEach((answer) => {
        if (answer.question.type === 'NPS' && answer.rating !== null) {
          npsScores.push(answer.rating);
          if (answer.rating >= 9) promoters++;
          else if (answer.rating >= 7 && answer.rating <= 8) passives++;
          else detractors++;
        }
      });
    });

    let npsScore: number | null = null;
    if (npsScores.length > 0) {
      npsScore = ((promoters - detractors) / npsScores.length) * 100;
    }

    // Calcular métricas agregadas por pergunta (todas as campanhas)
    const questionMetrics: any[] = [];

    // Pegar todas as perguntas únicas de todas as campanhas
    const allQuestions = activeCampaigns.flatMap(c => c.questions);

    allQuestions.forEach((question) => {
      const answers = responses.flatMap((r) =>
        r.answers.filter((a) => a.questionId === question.id)
      );
      const totalAnswers = answers.length;

      let avgRating = 0;
      let distribution: { [key: string]: number } = {};
      let optionDetails: { [key: string]: { color: string; imageUrl?: string } } = {};
      let negativeComments: any[] = [];

      if (question.type === 'SMILE' || question.type === 'SIMPLE_SMILE' || question.type === 'NPS' || question.type === 'SCALE') {
        const ratings = answers.filter((a) => a.rating !== null).map((a) => a.rating as number);
        if (ratings.length > 0) {
          avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        }

        ratings.forEach((rating) => {
          distribution[rating.toString()] = (distribution[rating.toString()] || 0) + 1;
        });

        const threshold = question.type === 'SMILE' ? 2 : question.type === 'SIMPLE_SMILE' ? 2 : question.type === 'NPS' ? 6 : (question.scaleMin || 1) + 1;
        negativeComments = answers
          .filter((a) => a.rating !== null && a.rating <= threshold && a.comment)
          .map((a) => ({
            rating: a.rating,
            comment: a.comment,
            date: responses.find((r) => r.answers.some((ans) => ans.id === a.id))?.createdAt,
          }))
          .slice(0, 5);
      } else if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE' || question.type === 'EMPLOYEE_RATING') {
        answers.forEach((a) => {
          a.selectedOptions.forEach((optId) => {
            const option = question.options.find((o) => o.id === optId);
            const optionText = option?.text || optId;
            distribution[optionText] = (distribution[optionText] || 0) + 1;
            if (option && !optionDetails[optionText]) {
              optionDetails[optionText] = { color: option.color || '#f97316', imageUrl: option.imageUrl || undefined };
            }
          });
        });
      } else if (question.type === 'TEXT_INPUT') {
        negativeComments = answers
          .filter((a) => a.comment)
          .map((a) => ({
            comment: a.comment,
            date: responses.find((r) => r.answers.some((ans) => ans.id === a.id))?.createdAt,
          }))
          .slice(0, 10);
      }

      questionMetrics.push({
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        avgRating,
        totalAnswers,
        distribution,
        optionColors: optionDetails,
        negativeComments,
        scaleMin: question.scaleMin,
        scaleMax: question.scaleMax,
        scaleMinLabel: question.scaleMinLabel,
        scaleMaxLabel: question.scaleMaxLabel,
      });
    });

    // Calcular média geral (excluindo NPS)
    const ratingQuestions = questionMetrics.filter((m) => m.questionType === 'SMILE' || m.questionType === 'SIMPLE_SMILE' || m.questionType === 'SCALE');
    const overallAvg = ratingQuestions.length > 0
      ? ratingQuestions.reduce((sum, m) => sum + m.avgRating, 0) / ratingQuestions.length
      : 0;

    // Respostas ao longo do tempo
    const responsesOverTime: { [key: string]: number } = {};
    const last30Days: Date[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push(date);
    }

    last30Days.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      responsesOverTime[dateStr] = 0;
    });

    responses.forEach((response) => {
      const dateStr = new Date(response.createdAt).toISOString().split('T')[0];
      if (responsesOverTime[dateStr] !== undefined) {
        responsesOverTime[dateStr]++;
      }
    });

    // Histórico de comentários
    const allComments = responses.flatMap((response) =>
      response.answers
        .filter((answer) => answer.comment && answer.comment.trim() !== '')
        .map((answer) => {
          const question = allQuestions.find((q) => q.id === answer.questionId);
          return {
            responseId: response.id,
            questionId: answer.questionId,
            questionText: question?.text || 'Pergunta não encontrada',
            questionType: question?.type || 'UNKNOWN',
            answerText: answer.rating !== null ? `Nota: ${answer.rating}` : '',
            rating: answer.rating,
            selectedOptions: answer.selectedOptions,
            comment: answer.comment,
            date: response.createdAt,
          };
        })
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Análise de sentimento
    const userId = terminal.userId;
    const userKeywords = await prisma.sentimentKeyword.findMany({
      where: { userId },
    });

    const customPositiveWords = userKeywords.filter((k: any) => k.type === 'POSITIVE').map((k: any) => k.word);
    const customNegativeWords = userKeywords.filter((k: any) => k.type === 'NEGATIVE').map((k: any) => k.word);

    const allTextComments = responses.flatMap((response: any) =>
      response.answers
        .filter((answer: any) => answer.comment && answer.comment.trim() !== '')
        .map((answer: any) => answer.comment)
    );

    const sentimentAnalysis = analyzeSentimentBatch(allTextComments, customPositiveWords, customNegativeWords);

    // Métricas por colaborador
    const employeeMetrics: any[] = [];
    const employeeQuestion = allQuestions.find((q) => q.type === 'EMPLOYEE_RATING');
    const evalQuestions = allQuestions.filter((q) =>
      q.type === 'SMILE' || q.type === 'SIMPLE_SMILE' || q.type === 'NPS' || q.type === 'SCALE'
    );

    if (employeeQuestion && evalQuestions.length > 0) {
      employeeQuestion.options.forEach((option) => {
        const employeeId = option.id;
        const employeeName = option.text;
        const employeeImageUrl = option.imageUrl;

        const responsesWithEmployee = responses.filter((r) =>
          r.answers.some((a) => a.questionId === employeeQuestion.id && a.selectedOptions?.includes(employeeId))
        );

        if (responsesWithEmployee.length > 0) {
          const employeeRatings = evalQuestions.map((ratingQ) => {
            const ratingAnswers = responsesWithEmployee.flatMap((r) => r.answers.filter((a) => a.questionId === ratingQ.id));
            const ratings = ratingAnswers.map((a) => a.rating).filter((r): r is number => r !== null);

            if (ratings.length === 0) return null;

            const distribution: any = {};
            ratings.forEach((rating: number) => {
              distribution[rating] = (distribution[rating] || 0) + 1;
            });

            const distributionArray = Object.entries(distribution).map(([label, count]) => ({
              label,
              count: count as number,
              percentage: ((count as number) / ratings.length) * 100,
              color: '#f97316',
            }));

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
            employeeMetrics.push({
              employeeId,
              employeeName,
              employeeImageUrl,
              totalResponses: responsesWithEmployee.length,
              ratings: employeeRatings,
            });
          }
        }
      });
    }

    // Retornar campanhas disponíveis
    const campaigns = terminal.campaigns.map(tc => ({
      id: tc.id,
      campaignId: tc.campaignId,
      title: tc.campaign.title,
      description: tc.description,
      customTitle: tc.customTitle,
      icon: tc.icon,
      color: tc.color,
      campaign: tc.campaign,
    }));

    return NextResponse.json({
      terminal: {
        id: terminal.id,
        name: terminal.name,
        email: terminal.email,
      },
      campaigns,
      hasMultipleCampaigns,
      campaign: hasMultipleCampaigns ? null : { id: activeCampaigns[0].id, title: activeCampaigns[0].title },
      totalResponses,
      overallAvg,
      npsScore,
      promoters,
      passives,
      detractors,
      questionMetrics,
      responsesOverTime,
      responsesLast7Days,
      responsesLast30Days,
      allComments,
      sentimentAnalysis,
      employeeMetrics,
    });
  } catch (error) {
    console.error('Error fetching terminal dashboard:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 });
  }
}