import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar usuário específico (admin only)
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

    // Verificar se é admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        companyName: true,
        responsiblePerson: true,
        cnpj: true,
        cep: true,
        address: true,
        addressNumber: true,
        addressComplement: true,
        neighborhood: true,
        city: true,
        state: true,
        planType: true,
        expiresAt: true,
        maxTerminals: true,
        emailCredits: true,
        dailyEmailLimit: true,
        logoUrl: true,
        lastAccess: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            campaigns: true,
            terminals: true,
            contacts: true,
            emailCampaigns: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Erro ao carregar usuário' }, { status: 500 });
  }
}

// PUT - Atualizar usuário (admin only)
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

    // Verificar se é admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      companyName,
      responsiblePerson,
      cnpj,
      planType,
      expiresAt,
      maxTerminals,
      dailyEmailLimit,
      isActive,
      role,
    } = body;

    // Verificar se email já existe (se foi alterado)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, id: { not: id } },
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        companyName,
        responsiblePerson,
        cnpj,
        planType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxTerminals: maxTerminals || 1,
        dailyEmailLimit: dailyEmailLimit || 100,
        isActive,
        role,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
