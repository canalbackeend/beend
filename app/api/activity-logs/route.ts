import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar logs de atividade do usuário (ou de outro usuário se admin)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const targetUserId = searchParams.get('userId');

    // Se userId foi fornecido e o usuário logado é admin, buscar logs do usuário alvo
    let logsUserId = user.id;
    if (targetUserId && user.role === 'ADMIN') {
      logsUserId = targetUserId;
    }

    const logs = await prisma.activityLog.findMany({
      where: { userId: logsUserId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.activityLog.count({
      where: { userId: logsUserId },
    });

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar logs de atividade' },
      { status: 500 }
    );
  }
}
