import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

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

    const responses = await prisma.response.findMany({
      where: { campaignId: params.campaignId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      totalResponses: responses.length,
      responses: responses.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        terminalId: r.terminalId,
        answers: r.answers.map((a) => ({
          id: a.id,
          questionId: a.questionId,
          questionType: a.question.type,
          rating: a.rating,
          selectedOptions: a.selectedOptions,
          comment: a.comment,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 });
  }
}