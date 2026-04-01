import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Criar nova resposta de pesquisa (público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, respondentName, respondentPhone, respondentEmail, answers, terminalId } = body;

    if (!campaignId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Verificar se a campanha existe e está ativa
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Esta campanha não está mais aceitando respostas' }, { status: 400 });
    }

    // Se terminalId foi fornecido, verificar se o terminal existe e está ativo
    if (terminalId) {
      const terminal = await prisma.terminal.findUnique({
        where: { id: terminalId },
      });

      if (!terminal || !terminal.isActive) {
        return NextResponse.json({ error: 'Terminal não encontrado ou inativo' }, { status: 404 });
      }
    }

    // Buscar perguntas da campanha para identificar colaborador selecionado
    const campaignQuestions = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: true },
        },
      },
    });

    // Encontrar o colaborador selecionado (primeira pergunta do tipo EMPLOYEE_RATING)
    let selectedEmployeeId: string | null = null;
    const employeeQuestion = campaignQuestions?.questions.find((q: any) => q.type === 'EMPLOYEE_RATING');
    
    if (employeeQuestion) {
      const employeeAnswer = answers.find((a: any) => a.questionId === employeeQuestion.id);
      if (employeeAnswer && employeeAnswer.selectedOptions && employeeAnswer.selectedOptions.length > 0) {
        selectedEmployeeId = employeeAnswer.selectedOptions[0];
      }
    }

    // Criar resposta
    console.log('Creating response with answers:', JSON.stringify(answers.map((a: any) => ({
      questionId: a.questionId,
      rating: a.rating,
      selectedOptions: a.selectedOptions,
      comment: a.comment
    }))));
    
    const response = await prisma.response.create({
      data: {
        campaignId,
        terminalId: terminalId || null,
        respondentName: respondentName || null,
        respondentPhone: respondentPhone || null,
        respondentEmail: respondentEmail || null,
        answers: {
          create: answers.map((answer: any) => ({
            questionId: answer.questionId,
            rating: answer.rating ?? null,
            selectedOptions: answer.selectedOptions || [],
            comment: answer.comment || null,
            selectedEmployeeId: selectedEmployeeId, // Salvar o colaborador selecionado em todas as respostas
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json({ error: 'Erro ao enviar resposta' }, { status: 500 });
  }
}

// PATCH - Atualizar dados de contato de uma resposta existente (público)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { responseId, respondentName, respondentPhone, respondentEmail } = body;

    if (!responseId) {
      return NextResponse.json({ error: 'ID da resposta é obrigatório' }, { status: 400 });
    }

    // Verificar se a resposta existe
    const existingResponse = await prisma.response.findUnique({
      where: { id: responseId },
    });

    if (!existingResponse) {
      return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 });
    }

    // Atualizar apenas os dados de contato
    const updatedResponse = await prisma.response.update({
      where: { id: responseId },
      data: {
        respondentName: respondentName || null,
        respondentPhone: respondentPhone || null,
        respondentEmail: respondentEmail || null,
      },
    });

    return NextResponse.json(updatedResponse, { status: 200 });
  } catch (error) {
    console.error('Error updating response contact info:', error);
    return NextResponse.json({ error: 'Erro ao atualizar dados de contato' }, { status: 500 });
  }
}
