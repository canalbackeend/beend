import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar todas as listas de contatos do usuário
export async function GET() {
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

    const lists = await prisma.contactList.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { contacts: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching contact lists:', error);
    return NextResponse.json({ error: 'Erro ao carregar listas' }, { status: 500 });
  }
}

// POST - Criar nova lista de contatos
export async function POST(request: NextRequest) {
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const list = await prisma.contactList.create({
      data: {
        name,
        description,
        userId: user.id,
      },
      include: {
        _count: {
          select: { contacts: true }
        }
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Error creating contact list:', error);
    return NextResponse.json({ error: 'Erro ao criar lista' }, { status: 500 });
  }
}
