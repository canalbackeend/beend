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
    const { name, campaignId, redirectUrl } = body;

    if (!name || !campaignId) {
      return NextResponse.json({ error: 'Nome e campanha são obrigatórios' }, { status: 400 });
    }

    // Verificar se a campanha existe e pertence ao usuário
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
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

    // Gerar uniqueLink para o terminal
    const uniqueLink = randomBytes(10).toString('hex');

    // Criar o terminal (sem campaignId direto, agora usa TerminalCampaign)
    const terminal = await prisma.terminal.create({
      data: {
        name,
        email: '',  // Será atualizado abaixo
        password: await bcrypt.hash('term123', 10), // Senha padrão
        uniqueLink,
        redirectUrl: redirectUrl || null,
        userId: user.id,
      },
    });

    // Gerar email baseado no ID
    const terminalNumber = terminal.id.slice(-8).replace(/[^0-9]/g, '').padStart(2, '0').slice(0, 2);
    const email = `term${terminalNumber}@beend.app`;

    // Atualizar o terminal com o email gerado
    await prisma.terminal.update({
      where: { id: terminal.id },
      data: { email },
    });

    // Criar a relação TerminalCampaign
    await prisma.terminalCampaign.create({
      data: {
        terminalId: terminal.id,
        campaignId: campaignId,
        order: 0,
        icon: 'faChartBar',
        color: '#3b82f6',
      },
    });

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
