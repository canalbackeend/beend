import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

// GET - Listar todos os terminais do usuário
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

    // Suporte para viewAsUser (admin visualizando dados de outro usuário)
    const { searchParams } = new URL(request.url);
    const viewAsUserId = searchParams.get('viewAsUser');
    
    let targetUserId = user.id;
    
    // Se é admin e quer visualizar como outro usuário
    if (viewAsUserId && user.role === 'ADMIN') {
      const targetUser = await prisma.user.findUnique({
        where: { id: viewAsUserId },
      });
      
      if (!targetUser) {
        return NextResponse.json({ error: 'Usuário alvo não encontrado' }, { status: 404 });
      }
      
      targetUserId = viewAsUserId;
    }

    const terminals = await prisma.terminal.findMany({
      where: { userId: targetUserId },
      include: {
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(terminals);
  } catch (error) {
    console.error('Error fetching terminals:', error);
    return NextResponse.json({ error: 'Erro ao buscar terminais' }, { status: 500 });
  }
}

// POST - Criar novo terminal
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
    const { name, campaignIds, campaignColors, redirectUrl } = body;

    if (!name || !campaignIds || campaignIds.length === 0) {
      return NextResponse.json({ error: 'Nome e ao menos uma campanha são obrigatórios' }, { status: 400 });
    }

    // Verificar se as campanhas existem e pertencem ao usuário
    const campaigns = await prisma.campaign.findMany({
      where: {
        id: { in: campaignIds },
        userId: user.id,
      },
    });

    if (campaigns.length !== campaignIds.length) {
      return NextResponse.json({ error: 'Uma ou mais campanhas não encontradas' }, { status: 404 });
    }

    // Verificar limite de terminais
    const terminalsCount = await prisma.terminal.count({
      where: { userId: user.id },
    });

    if (terminalsCount >= user.maxTerminals) {
      return NextResponse.json(
        { error: `Limite de ${user.maxTerminals} terminal(is) atingido. Entre em contato com o administrador.` },
        { status: 403 }
      );
    }

    // Gerar uniqueLink e email únicos
    const uniqueLink = randomBytes(10).toString('hex');
    const email = `term-${randomBytes(4).toString('hex')}@beend.tech`;

    // Criar o terminal com email já definido (100% sem colisão)
    const terminal = await prisma.terminal.create({
      data: {
        name,
        email,
        password: await bcrypt.hash('term123', 10),
        uniqueLink,
        redirectUrl: redirectUrl || null,
        userId: user.id,
      },
    });

    // Criar as relações TerminalCampaign para cada campanha
    for (let i = 0; i < campaignIds.length; i++) {
      const campaignId = campaignIds[i];
      await prisma.terminalCampaign.create({
        data: {
          terminalId: terminal.id,
          campaignId: campaignId,
          order: i,
          icon: 'faChartBar',
          color: campaignColors?.[campaignId] || '#3b82f6',
        },
      });
    }

    // Buscar o terminal atualizado com as campanhas
    const updatedTerminal = await prisma.terminal.findUnique({
      where: { id: terminal.id },
      include: {
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(updatedTerminal, { status: 201 });
  } catch (error: any) {
    console.error('Error creating terminal:', error);
    
    // Verificar erro de email duplicado
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email de terminal já existe' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro ao criar terminal' }, { status: 500 });
  }
}
