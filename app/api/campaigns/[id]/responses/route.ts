import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// DELETE - Resetar todas as respostas de uma campanha
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const campaignId = params.id;

    // Verificar se a campanha existe e pertence ao usuário
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campanha não encontrada ou sem permissão' },
        { status: 404 }
      );
    }

    // Deletar todas as respostas da campanha
    const deletedCount = await prisma.response.deleteMany({
      where: {
        campaignId: campaignId,
      },
    });

    return NextResponse.json({
      message: 'Respostas resetadas com sucesso',
      deletedCount: deletedCount.count,
    });
  } catch (error) {
    console.error('Error deleting campaign responses:', error);
    return NextResponse.json(
      { error: 'Erro ao resetar respostas da campanha' },
      { status: 500 }
    );
  }
}
