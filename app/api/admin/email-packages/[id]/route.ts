import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT - Atualizar pacote
export async function PUT(
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, credits, price, description, isActive } = body;

    const pkg = await prisma.emailPackage.update({
      where: { id: params.id },
      data: {
        name,
        credits: parseInt(credits),
        price: parseFloat(price),
        description: description || null,
        isActive,
      },
    });

    return NextResponse.json(pkg);
  } catch (error) {
    console.error('Error updating email package:', error);
    return NextResponse.json({ error: 'Erro ao atualizar pacote' }, { status: 500 });
  }
}

// DELETE - Excluir pacote
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await prisma.emailPackage.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email package:', error);
    return NextResponse.json({ error: 'Erro ao excluir pacote' }, { status: 500 });
  }
}
