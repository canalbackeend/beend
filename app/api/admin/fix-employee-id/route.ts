import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    console.log('Received:', { answerId, newEmployeeId, typeAnswerId: typeof answerId, typeNewId: typeof newEmployeeId });

    if (!answerId || !newEmployeeId || answerId === '' || newEmployeeId === '') {
      return NextResponse.json({ 
        error: 'answerId e newEmployeeId são obrigatórios', 
        details: { answerId: !!answerId, newEmployeeId: !!newEmployeeId } 
      }, { status: 400 });
    }

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          include: {
            campaign: true,
          },
        },
      },
    });

    if (!answer) {
      return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 });
    }

    if (answer.question.campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const updated = await prisma.answer.update({
      where: { id: answerId },
      data: {
        selectedOptions: [newEmployeeId],
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'ID do employee atualizado',
      updatedId: updated.id,
    });

  } catch (error) {
    console.error('Error updating answer:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}