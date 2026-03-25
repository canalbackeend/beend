import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET - Listar todos os usuários (apenas admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
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
        lastAccess: true,
        createdAt: true,
        _count: {
          select: { campaigns: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

// POST - Criar novo usuário (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário, campanha padrão e terminal em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar o usuário
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'USER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Criar uma campanha padrão para o novo usuário (não-admin)
      if (user.role === 'USER') {
        const campaign = await tx.campaign.create({
          data: {
            title: 'Pesquisa de Satisfação - Padrão',
            description: 'Campanha padrão criada automaticamente',
            status: 'ACTIVE',
            userId: user.id,
            questions: {
              create: [
                {
                  text: 'Como você avalia nosso atendimento?',
                  type: 'SMILE',
                  order: 1,
                },
                {
                  text: 'De 0 a 10, qual a probabilidade de você nos recomendar?',
                  type: 'NPS',
                  order: 2,
                },
              ],
            },
          },
        });

        // Criar Terminal 1 automaticamente
        const terminal = await tx.terminal.create({
          data: {
            name: 'Terminal 1',
            email: `term${Date.now() % 100000}@beend.app`,
            password: 'term123',
            userId: user.id,
          },
        });

        // Criar a relação TerminalCampaign
        await tx.terminalCampaign.create({
          data: {
            terminalId: terminal.id,
            campaignId: campaign.id,
            order: 0,
            isActive: true,
          },
        });
      }

      return user;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}
