import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar todas as palavras-chave do usuário
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

    const keywords = await prisma.sentimentKeyword.findMany({
      where: { userId: user.id },
      orderBy: [
        { type: 'asc' }, // POSITIVE primeiro
        { word: 'asc' },
      ],
    });

    // Organizar por tipo
    const positive = keywords.filter((k: any) => k.type === 'POSITIVE');
    const negative = keywords.filter((k: any) => k.type === 'NEGATIVE');

    return NextResponse.json({ positive, negative });
  } catch (error) {
    console.error('Error fetching sentiment keywords:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar palavras-chave' },
      { status: 500 }
    );
  }
}

// POST - Adicionar nova palavra-chave
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
    const { word, type } = body;

    if (!word || !type) {
      return NextResponse.json(
        { error: 'Palavra e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    if (type !== 'POSITIVE' && type !== 'NEGATIVE') {
      return NextResponse.json(
        { error: 'Tipo deve ser POSITIVE ou NEGATIVE' },
        { status: 400 }
      );
    }

    // Normalizar palavra (minúsculas, sem espaços extras)
    const normalizedWord = word.trim().toLowerCase();

    if (!normalizedWord) {
      return NextResponse.json(
        { error: 'Palavra não pode ser vazia' },
        { status: 400 }
      );
    }

    // Criar palavra-chave
    const keyword = await prisma.sentimentKeyword.create({
      data: {
        word: normalizedWord,
        type,
        userId: user.id,
      },
    });

    return NextResponse.json(keyword, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sentiment keyword:', error);
    
    // Checar se é erro de duplicata
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Esta palavra já existe' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar palavra-chave' },
      { status: 500 }
    );
  }
}

// DELETE - Remover palavra-chave
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da palavra-chave é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a palavra pertence ao usuário
    const keyword = await prisma.sentimentKeyword.findUnique({
      where: { id },
    });

    if (!keyword) {
      return NextResponse.json(
        { error: 'Palavra-chave não encontrada' },
        { status: 404 }
      );
    }

    if (keyword.userId !== user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir esta palavra-chave' },
        { status: 403 }
      );
    }

    await prisma.sentimentKeyword.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Palavra-chave removida com sucesso' });
  } catch (error) {
    console.error('Error deleting sentiment keyword:', error);
    return NextResponse.json(
      { error: 'Erro ao remover palavra-chave' },
      { status: 500 }
    );
  }
}
