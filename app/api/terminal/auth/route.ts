import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// POST - Autenticar terminal
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar terminal com suas campanhas
    const terminal = await prisma.terminal.findUnique({
      where: { email },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            logoUrl: true,
          },
        },
        campaigns: {
          where: {
            isActive: true,
          },
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                uniqueLink: true,
                lgpdText: true,
                collectName: true,
                collectPhone: true,
                collectEmail: true,
                questions: {
                  include: {
                    options: true,
                    employees: {
                      include: {
                        employee: true,
                      },
                    },
                  },
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!terminal) {
      return NextResponse.json(
        { error: 'Terminal não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se terminal está ativo
    if (!terminal.isActive) {
      return NextResponse.json(
        { error: 'Terminal inativo. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, terminal.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Filtrar apenas campanhas ativas
    const activeCampaigns = terminal.campaigns.filter(
      tc => tc.campaign.status === 'ACTIVE'
    );

    // Retornar dados do terminal e campanhas
    return NextResponse.json({
      terminal: {
        id: terminal.id,
        name: terminal.name,
        email: terminal.email,
      },
      user: {
        id: terminal.user.id,
        name: terminal.user.name,
        companyName: terminal.user.companyName || terminal.user.name,
        logo: terminal.user.logoUrl,
      },
      campaigns: activeCampaigns,
      // Manter compatibilidade com versão antiga (primeira campanha)
      campaign: activeCampaigns.length > 0 ? activeCampaigns[0].campaign : null,
    });
  } catch (error) {
    console.error('Error authenticating terminal:', error);
    return NextResponse.json(
      { error: 'Erro ao autenticar terminal' },
      { status: 500 }
    );
  }
}
