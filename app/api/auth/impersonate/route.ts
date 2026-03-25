import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Apenas admins podem impersonar
    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Buscar usuário a ser impersonado
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Não permitir impersonar outro admin
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Não é possível impersonar outro administrador' }, { status: 403 });
    }

    // Criar token de impersonation
    const impersonationToken = sign(
      {
        userId: targetUser.id,
        adminId: session.user.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        isImpersonating: true,
      },
      process.env.NEXTAUTH_SECRET || 'secret',
      { expiresIn: '2h' }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
      },
      impersonationToken,
    });
  } catch (error) {
    console.error('Error during impersonation:', error);
    return NextResponse.json({ error: 'Erro ao acessar conta do usuário' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Terminar impersonation
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending impersonation:', error);
    return NextResponse.json({ error: 'Erro ao encerrar acesso' }, { status: 500 });
  }
}
