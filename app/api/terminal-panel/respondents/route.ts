import { NextResponse } from 'next/server';
import { getTerminalSession } from '@/lib/terminal-auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper para converter Answer do Prisma para formato simplificado
function getAnswerValue(answer: any, questionOptions: any[] = []): string {
  // Para perguntas de rating (SMILE, NPS, SCALE)
  if (answer.rating !== null) {
    return answer.rating.toString();
  }

  // Para perguntas de múltipla escolha - mapear IDs para textos
  if (answer.selectedOptions && answer.selectedOptions.length > 0) {
    // Mapear os IDs para os textos das opções
    const optionTexts = answer.selectedOptions
      .map((optionId: string) => {
        const option = questionOptions.find((opt) => opt.id === optionId);
        return option ? option.text : optionId; // Fallback para o ID se não encontrar
      })
      .filter((text: string) => text); // Remover valores vazios

    return optionTexts.join(', ');
  }

  // Para perguntas de texto ou se não houver outro valor
  return answer.comment || '';
}

export async function GET() {
  try {
    const session = await getTerminalSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar todas as respostas do terminal que têm pelo menos um dado de contato
    const responses = await prisma.response.findMany({
      where: {
        terminalId: session.terminalId,
        OR: [
          { respondentName: { not: null } },
          { respondentEmail: { not: null } },
          { respondentPhone: { not: null } },
        ],
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            description: true,
            questions: {
              select: {
                id: true,
                options: {
                  select: {
                    id: true,
                    text: true,
                  },
                },
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Agrupar respostas por respondente
    const respondentsMap = new Map<string, any>();

    responses.forEach((response) => {
      const key =
        response.respondentEmail ||
        response.respondentPhone ||
        response.respondentName ||
        `anon-${response.id}`;

      if (!respondentsMap.has(key)) {
        respondentsMap.set(key, {
          id: key,
          name: response.respondentName || 'Anônimo',
          email: response.respondentEmail || null,
          phone: response.respondentPhone || null,
          firstResponse: response.createdAt,
          lastResponse: response.createdAt,
          totalResponses: 0,
          responses: [],
        });
      }

      const respondent = respondentsMap.get(key);
      respondent.totalResponses++;
      respondent.lastResponse = response.createdAt;

      // Adicionar esta resposta ao histórico
      respondent.responses.push({
        id: response.id,
        campaignId: response.campaignId,
        campaignTitle: response.campaign.title,
        campaignDescription: response.campaign.description,
        createdAt: response.createdAt,
        answers: response.answers.map((answer) => {
          // Buscar as opções da pergunta correspondente
          const question = response.campaign.questions.find(
            (q: any) => q.id === answer.questionId
          );
          const questionOptions = question?.options || [];

          return {
            questionId: answer.questionId,
            questionText: answer.question.text,
            questionType: answer.question.type,
            value: getAnswerValue(answer, questionOptions),
            comment: answer.comment,
          };
        }),
      });
    });

    // Converter o Map em array e ordenar por data da última resposta
    const respondents = Array.from(respondentsMap.values()).sort(
      (a, b) => new Date(b.lastResponse).getTime() - new Date(a.lastResponse).getTime()
    );

    return NextResponse.json(respondents);
  } catch (error) {
    console.error('Error fetching terminal respondents:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar respondentes' },
      { status: 500 }
    );
  }
}
