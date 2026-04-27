import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId é obrigatório' }, { status: 400 });
    }

    // Buscar a campanha com as perguntas e opções atuais
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        questions: {
          where: { type: 'EMPLOYEE_RATING' },
          include: {
            options: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const employeeQuestion = campaign.questions[0];
    if (!employeeQuestion) {
      return NextResponse.json({ error: 'Pergunta EMPLOYEE_RATING não encontrada' }, { status: 404 });
    }

    // Mapear os nomes dos employees atuais pelo nome
    const currentOptionsByName: Record<string, string> = {};
    employeeQuestion.options.forEach((opt: any) => {
      currentOptionsByName[opt.text.toLowerCase().trim()] = opt.id;
    });

    // BUSCAR TODAS as respostas da campanha
    const responses = await prisma.response.findMany({
      where: { campaignId },
      include: {
        answers: {
          where: { questionId: employeeQuestion.id },
        },
      },
    });

    let updatedCount = 0;
    const updates: any[] = [];

    // Para cada resposta, verificar se o employee ainda existe
    for (const response of responses) {
      for (const answer of response.answers) {
        const selectedOptions = answer.selectedOptions || [];
        
        if (selectedOptions.length > 0) {
          const oldEmployeeId = selectedOptions[0];
          
          // Verificar se esse ID ainda existe nas options atuais
          const optionStillExists = employeeQuestion.options.some((o: any) => o.id === oldEmployeeId);
          
          if (!optionStillExists) {
            // O ID antigo não existe mais, precisamos encontrar o novo pelo nome
            // Buscar a resposta da pergunta SIMPLE_SMILE para inferir o employee
            const allAnswers = await prisma.answer.findMany({
              where: { responseId: response.id },
              include: { question: true },
            });
            
            // O employee foi baseado na resposta EMPLOYEE_RATING, então precisamos adivinhar pelo contexto
            // Na verdade, não temos como saber qual era o employee antigo pelo nome
            // Vamos verificar se a resposta tem algum comentário que ajude
            const mainAnswer = allAnswers.find((a: any) => a.questionId === employeeQuestion.id);
            
            // Como não temos como rastrear o employee antigo, vamos marcar para análise manual
            updates.push({
              responseId: response.id,
              answerId: answer.id,
              oldEmployeeId,
              newEmployeeId: null,
              status: 'NOT_FOUND',
            });
          }
        }
      }
    }

    // Retornar relatório do que foi encontrado
    return NextResponse.json({
      success: true,
      campaignId,
      employeeQuestionId: employeeQuestion.id,
      currentOptions: employeeQuestion.options.map((o: any) => ({ id: o.id, text: o.text })),
      totalResponses: responses.length,
      updates,
      message: 'Verificação concluída. IDs não encontrados foram listados para correção manual.',
    });

  } catch (error) {
    console.error('Error in migration check:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

// Endpoint para atualizar um ID específico
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { answerId, newEmployeeId } = body;

    if (!answerId || !newEmployeeId) {
      return NextResponse.json({ error: 'answerId e newEmployeeId são obrigatórios' }, { status: 400 });
    }

    // Atualizar o ID do employee na resposta
    const updated = await prisma.answer.update({
      where: { id: answerId },
      data: {
        selectedOptions: [newEmployeeId],
      },
    });

    return NextResponse.json({ success: true, updated });

  } catch (error) {
    console.error('Error updating answer:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}