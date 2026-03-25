import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar contato específico
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

    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
      include: {
        list: { select: { id: true, name: true } }
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({ error: 'Erro ao carregar contato' }, { status: 500 });
  }
}

// PUT - Atualizar contato
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

    const existing = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { email, name, phone, company, listId, tags } = body;

    // Verificar se novo email já existe (se foi alterado)
    if (email && email !== existing.email) {
      const duplicate = await prisma.contact.findFirst({
        where: { userId: user.id, email, id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 });
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        email,
        name,
        phone,
        company,
        listId: listId || null,
        tags,
      },
      include: {
        list: { select: { id: true, name: true } }
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Erro ao atualizar contato' }, { status: 500 });
  }
}

// DELETE - Excluir contato
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

    const existing = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }

    await prisma.contact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Erro ao excluir contato' }, { status: 500 });
  }
}
