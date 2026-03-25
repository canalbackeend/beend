import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar terminal específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const terminal = await prisma.terminal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!terminal) {
      return NextResponse.json({ error: 'Terminal não encontrado' }, { status: 404 });
    }

    return NextResponse.json(terminal);
  } catch (error) {
    console.error('Error fetching terminal:', error);
    return NextResponse.json({ error: 'Erro ao buscar terminal' }, { status: 500 });
  }
}

// PUT - Atualizar terminal
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { name, isActive, redirectUrl } = body;

    // Verificar se o terminal pertence ao usuário
    const terminal = await prisma.terminal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!terminal) {
      return NextResponse.json({ error: 'Terminal não encontrado' }, { status: 404 });
    }

    // Atualizar o terminal
    const updatedTerminal = await prisma.terminal.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(redirectUrl !== undefined && { redirectUrl: redirectUrl || null }),
      },
      include: {
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(updatedTerminal);
  } catch (error) {
    console.error('Error updating terminal:', error);
    return NextResponse.json({ error: 'Erro ao atualizar terminal' }, { status: 500 });
  }
}

// DELETE - Deletar terminal
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verificar se o terminal pertence ao usuário
    const terminal = await prisma.terminal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!terminal) {
      return NextResponse.json({ error: 'Terminal não encontrado' }, { status: 404 });
    }

    // Deletar o terminal
    await prisma.terminal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Terminal deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting terminal:', error);
    return NextResponse.json({ error: 'Erro ao deletar terminal' }, { status: 500 });
  }
}
