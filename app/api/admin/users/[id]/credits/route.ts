import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Ajustar créditos de email (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { amount, description } = body;

    if (!amount || amount === 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se remoção não deixa saldo negativo
    if (amount < 0 && user.emailCredits + amount < 0) {
      return NextResponse.json({ error: 'Saldo insuficiente para esta operação' }, { status: 400 });
    }

    const newBalance = user.emailCredits + amount;

    // Atualizar créditos e criar transação
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { emailCredits: newBalance },
      }),
      prisma.emailCreditTransaction.create({
        data: {
          userId: id,
          amount,
          balance: newBalance,
          type: amount > 0 ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT',
          description: description || (amount > 0 ? 'Créditos adicionados pelo administrador' : 'Créditos removidos pelo administrador'),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      newBalance,
      message: amount > 0 ? `${amount} créditos adicionados` : `${Math.abs(amount)} créditos removidos`,
    });
  } catch (error) {
    console.error('Error adjusting credits:', error);
    return NextResponse.json({ error: 'Erro ao ajustar créditos' }, { status: 500 });
  }
}
