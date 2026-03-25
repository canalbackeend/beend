import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar lista específica com contatos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const list = await prisma.contactList.findFirst({
      where: { id, userId: user.id },
      include: {
        contacts: {
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { contacts: true }
        }
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching contact list:', error);
    return NextResponse.json({ error: 'Erro ao carregar lista' }, { status: 500 });
  }
}

// PUT - Atualizar lista
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existing = await prisma.contactList.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    const list = await prisma.contactList.update({
      where: { id },
      data: { name, description },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error updating contact list:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lista' }, { status: 500 });
  }
}

// DELETE - Excluir lista
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existing = await prisma.contactList.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    await prisma.contactList.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact list:', error);
    return NextResponse.json({ error: 'Erro ao excluir lista' }, { status: 500 });
  }
}
