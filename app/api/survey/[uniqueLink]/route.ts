import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar campanha pública por uniqueLink (pode ser de campanha ou terminal)
export async function GET(request: NextRequest, { params }: { params: { uniqueLink: string } }) {
  try {
    // Primeiro, verificar se é um link de terminal
    const terminal = await prisma.terminal.findUnique({
      where: { uniqueLink: params.uniqueLink },
      include: {
        campaigns: {
          include: {
            campaign: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  include: { 
                    options: { orderBy: { order: 'asc' } },
                    employees: {
                      include: {
                        employee: true,
                      },
                      orderBy: { order: 'asc' },
                    },
                  },
                },
                user: {
                  select: {
                    logoUrl: true,
                  },
                },
              },
            },
          },
          where: { isActive: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
        user: {
          select: {
            logoUrl: true,
          },
        },
      },
    });

    if (terminal) {
      // Verificar se o terminal está ativo
      if (!terminal.isActive) {
        return NextResponse.json({ error: 'Terminal inativo' }, { status: 403 });
      }

      // Verificar se tem campanhas vinculadas
      if (terminal.campaigns.length === 0) {
        return NextResponse.json({ error: 'Nenhuma campanha vinculada ao terminal' }, { status: 404 });
      }

      const activeCampaign = terminal.campaigns[0].campaign;

      // Verificar se a campanha está ativa
      if (activeCampaign.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Campanha não está ativa' }, { status: 403 });
      }

      // Retornar campanha com informações do terminal
      return NextResponse.json({
        ...activeCampaign,
        terminalId: terminal.id,
        terminalName: terminal.name,
        isTerminalLink: true,
        redirectUrl: terminal.redirectUrl || null,
      });
    }

    // Se não for terminal, verificar se é link de campanha
    const campaign = await prisma.campaign.findUnique({
      where: { uniqueLink: params.uniqueLink },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { 
            options: { orderBy: { order: 'asc' } },
            employees: {
              include: {
                employee: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        user: {
          select: {
            logoUrl: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Pesquisa não encontrada' }, { status: 404 });
    }

    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Esta pesquisa não está mais aceitando respostas' }, { status: 403 });
    }

    // Retornar campanha sem terminal (link direto da campanha)
    return NextResponse.json({
      ...campaign,
      terminalId: null,
      isTerminalLink: false,
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json({ error: 'Erro ao buscar pesquisa' }, { status: 500 });
  }
}
