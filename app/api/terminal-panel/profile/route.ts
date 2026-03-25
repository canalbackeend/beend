import { NextResponse } from 'next/server';
import { getTerminalSession } from '@/lib/terminal-auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getTerminalSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const terminal = await prisma.terminal.findUnique({
      where: { id: session.terminalId },
      include: {
        campaigns: {
          include: {
            campaign: {
              select: {
                title: true,
              },
            },
          },
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        user: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!terminal) {
      return NextResponse.json({ error: 'Terminal não encontrado' }, { status: 404 });
    }

    // Pegar títulos das campanhas
    const campaignTitles = terminal.campaigns.map(tc => tc.campaign.title);

    return NextResponse.json({
      id: terminal.id,
      name: terminal.name,
      email: terminal.email,
      campaignTitle: campaignTitles.length > 0 ? campaignTitles.join(', ') : 'Nenhuma campanha',
      campaignCount: terminal.campaigns.length,
      createdAt: terminal.createdAt,
      parentUser: {
        name: terminal.user.name,
        logoUrl: terminal.user.logoUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching terminal profile:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do perfil' },
      { status: 500 }
    );
  }
}
