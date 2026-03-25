import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Salvar resposta do terminal
export async function POST(request: NextRequest) {
  try {
    const { terminalId, campaignId, responses, respondentName, respondentPhone, respondentEmail } = await request.json();

    if (!terminalId || !campaignId || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Verificar se o terminal existe e está ativo
    const terminal = await prisma.terminal.findUnique({
      where: { id: terminalId },
    });

    if (!terminal || !terminal.isActive) {
      return NextResponse.json(
        { error: 'Terminal não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Usar transação única para melhor performance
    const result = await prisma.$transaction(async (tx) => {
      // Criar resposta principal
      const response = await tx.response.create({
        data: {
          campaignId,
          terminalId,
          respondentName: respondentName || null,
          respondentPhone: respondentPhone || null,
          respondentEmail: respondentEmail || terminal.email,
        },
      });

      // Criar todas as respostas individuais de uma vez
      const answersData = responses.map((item: any) => {
        const answerValue = item.answerText;
        const isNumeric = !isNaN(Number(answerValue));
        
        return {
          responseId: response.id,
          questionId: item.questionId,
          rating: isNumeric ? parseInt(answerValue) : null,
          selectedOptions: !isNumeric ? [answerValue] : [],
          comment: item.comment || null,
        };
      });

      await tx.answer.createMany({
        data: answersData,
      });

      return response;
    });

    return NextResponse.json(
      { message: 'Resposta salva com sucesso', responseId: result.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving terminal response:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar resposta' },
      { status: 500 }
    );
  }
}
