import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar credenciais de um usuário específico (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar dados do usuário alvo
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        responsiblePerson: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar todos os terminais do usuário alvo
    const terminals = await prisma.terminal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isActive: true,
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      user: targetUser,
      terminals,
    });
  } catch (error) {
    console.error('Error fetching user credentials:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar credenciais do usuário' },
      { status: 500 }
    );
  }
}
