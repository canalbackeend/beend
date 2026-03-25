import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar todos os contatos do usuário
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
    const listId = searchParams.get('listId');

    const where: { userId: string; listId?: string | null } = { userId: user.id };
    if (listId) {
      where.listId = listId === 'none' ? null : listId;
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        list: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Erro ao carregar contatos' }, { status: 500 });
  }
}

// POST - Criar novo contato
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
    const { email, name, phone, company, listId, tags } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Verificar se email já existe para este usuário
    const existing = await prisma.contact.findFirst({
      where: { userId: user.id, email },
    });

    if (existing) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        email,
        name,
        phone,
        company,
        listId: listId || null,
        tags,
        userId: user.id,
      },
      include: {
        list: {
          select: { id: true, name: true }
        }
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 });
  }
}
