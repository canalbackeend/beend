import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

// GET - Obter dados do perfil
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Suporte para viewAsUser (admin visualizando dados de outro usuário)
    const { searchParams } = new URL(request.url);
    const viewAsUserId = searchParams.get('viewAsUser');
    
    let targetUserId = currentUser.id;
    
    // Se é admin e quer visualizar como outro usuário
    if (viewAsUserId && currentUser.role === 'ADMIN') {
      const targetUser = await prisma.user.findUnique({
        where: { id: viewAsUserId },
      });
      
      if (!targetUser) {
        return NextResponse.json({ error: 'Usuário alvo não encontrado' }, { status: 404 });
      }
      
      targetUserId = viewAsUserId;
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true,
        companyName: true,
        responsiblePerson: true,
        cnpj: true,
        planType: true,
        expiresAt: true,
        maxTerminals: true,
        emailCredits: true,
        cep: true,
        address: true,
        addressNumber: true,
        addressComplement: true,
        neighborhood: true,
        city: true,
        state: true,
        logoUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar perfil (senha)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      { message: 'Senha atualizada com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar senha' },
      { status: 500 }
    );
  }
}
