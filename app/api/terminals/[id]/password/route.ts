import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// PUT - Atualizar senha do terminal
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
    const { password } = body;

    if (!password || password.trim() === '') {
      return NextResponse.json({ error: 'Senha é obrigatória' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres' }, { status: 400 });
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

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar senha e marcar como não-padrão
    await prisma.terminal.update({
      where: { id: params.id },
      data: { 
        password: hashedPassword,
        isDefaultPassword: false,
      },
    });

    return NextResponse.json({ message: 'Senha do terminal atualizada com sucesso' });
  } catch (error) {
    console.error('Error updating terminal password:', error);
    return NextResponse.json({ error: 'Erro ao atualizar senha do terminal' }, { status: 500 });
  }
}
