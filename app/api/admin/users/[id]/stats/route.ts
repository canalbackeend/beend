import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        isActive: true,
        maxTerminals: true,
        createdAt: true,
        lastAccess: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar terminais
    const terminals = await prisma.terminal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Buscar último acesso de cada terminal (última resposta)
    const terminalLastAccess = await Promise.all(
      terminals.map(async (t) => {
        const lastResponse = await prisma.response.findFirst({
          where: { terminalId: t.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });
        return { terminalId: t.id, lastAccess: lastResponse?.createdAt ?? null };
      })
    );

    // Datas para filtros
    const now = new Date();
    const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const days15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const days90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Buscar campanhas do usuário
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      select: { id: true, title: true },
    });

    const campaignIds = campaigns.map((c) => c.id);

    // Contagem de respostas por período
    const [responses7, responses15, responses30, responses90] = await Promise.all([
      prisma.response.count({
        where: { campaignId: { in: campaignIds }, createdAt: { gte: days7 } },
      }),
      prisma.response.count({
        where: { campaignId: { in: campaignIds }, createdAt: { gte: days15 } },
      }),
      prisma.response.count({
        where: { campaignId: { in: campaignIds }, createdAt: { gte: days30 } },
      }),
      prisma.response.count({
        where: { campaignId: { in: campaignIds }, createdAt: { gte: days90 } },
      }),
    ]);

    // Contagem por origem (WebView vs Terminal)
    const [webviewResponses, terminalResponses] = await Promise.all([
      prisma.response.count({
        where: {
          campaignId: { in: campaignIds },
          terminalId: null,
          createdAt: { gte: days90 },
        },
      }),
      prisma.response.count({
        where: {
          campaignId: { in: campaignIds },
          terminalId: { not: null },
          createdAt: { gte: days90 },
        },
      }),
    ]);

    // Último acesso WebView (resposta sem terminal)
    const lastWebviewResponse = await prisma.response.findFirst({
      where: { campaignId: { in: campaignIds }, terminalId: null },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // Último acesso Terminal (resposta com terminal)
    const lastTerminalResponse = await prisma.response.findFirst({
      where: { campaignId: { in: campaignIds }, terminalId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // Evolução diária (últimos 30 dias)
    const dailyResponses = await prisma.response.groupBy({
      by: ['createdAt'],
      where: {
        campaignId: { in: campaignIds },
        createdAt: { gte: days30 },
      },
      _count: { id: true },
    });

    // Agrupar por dia
    const dailyData: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dailyData[key] = 0;
    }

    dailyResponses.forEach((r) => {
      const key = new Date(r.createdAt).toISOString().split('T')[0];
      if (dailyData[key] !== undefined) {
        dailyData[key] += r._count.id;
      }
    });

    // Respostas por terminal
    const responsesByTerminal = await prisma.response.groupBy({
      by: ['terminalId'],
      where: {
        campaignId: { in: campaignIds },
        terminalId: { not: null },
        createdAt: { gte: days90 },
      },
      _count: { id: true },
    });

    const terminalStats = terminals.map((t) => {
      const respCount = responsesByTerminal.find((r) => r.terminalId === t.id)?._count.id ?? 0;
      const lastAccess = terminalLastAccess.find((la) => la.terminalId === t.id)?.lastAccess ?? null;
      return {
        ...t,
        lastAccess,
        responseCount: respCount,
      };
    });

    // Respostas por campanha
    const responsesByCampaign = await prisma.response.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: campaignIds },
        createdAt: { gte: days90 },
      },
      _count: { id: true },
    });

    const campaignStats = campaigns.map((c) => {
      const respCount = responsesByCampaign.find((r) => r.campaignId === c.id)?._count.id ?? 0;
      return {
        ...c,
        responseCount: respCount,
      };
    });

    // Horários de pico (agrupado por hora)
    const hourlyResponses = await prisma.$queryRaw<{ hour: number; count: bigint }[]>`
      SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count
      FROM "Response"
      WHERE "campaignId" = ANY(${campaignIds})
      AND "createdAt" >= ${days30}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `;

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Number(hourlyResponses.find((h) => Number(h.hour) === i)?.count ?? 0),
    }));

    // Status de atividade (baseado nos últimos 30 dias)
    const isActiveRecently = responses30 > 0;
    const activityStatus = responses7 > 0 ? 'active' : responses30 > 0 ? 'moderate' : 'inactive';

    // Estatísticas de acessos (SurveyAccess)
    const [
      totalAccesses,
      completedAccesses,
      accesses7,
      accesses30,
      accesses90,
      accessesBySource,
      lastAccessWebview,
      lastAccessTerminal,
    ] = await Promise.all([
      prisma.surveyAccess.count({
        where: { campaignId: { in: campaignIds } },
      }),
      prisma.surveyAccess.count({
        where: { campaignId: { in: campaignIds }, completed: true },
      }),
      prisma.surveyAccess.count({
        where: { campaignId: { in: campaignIds }, createdAt: { gte: days7 } },
      }),
      prisma.surveyAccess.count({
        where: { campaignId: { in: campaignIds }, createdAt: { gte: days30 } },
      }),
      prisma.surveyAccess.count({
        where: { campaignId: { in: campaignIds }, createdAt: { gte: days90 } },
      }),
      prisma.surveyAccess.groupBy({
        by: ['source'],
        where: { campaignId: { in: campaignIds }, createdAt: { gte: days90 } },
        _count: { id: true },
      }),
      prisma.surveyAccess.findFirst({
        where: { campaignId: { in: campaignIds }, terminalId: null },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      prisma.surveyAccess.findFirst({
        where: { campaignId: { in: campaignIds }, terminalId: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // Conversão (acessos -> respostas completas)
    const conversionRate = totalAccesses > 0 ? Math.round((completedAccesses / totalAccesses) * 100) : 0;

    // Acessos por fonte
    const accessSourceStats = {
      webview: accessesBySource.find((a) => a.source === 'WEBVIEW')?._count.id ?? 0,
      terminal: accessesBySource.find((a) => a.source === 'TERMINAL')?._count.id ?? 0,
      qrCode: accessesBySource.find((a) => a.source === 'QR_CODE')?._count.id ?? 0,
    };

    return NextResponse.json({
      user,
      terminals: terminalStats,
      responses: {
        last7Days: responses7,
        last15Days: responses15,
        last30Days: responses30,
        last90Days: responses90,
        byWebview: webviewResponses,
        byTerminal: terminalResponses,
      },
      lastAccess: {
        webview: lastAccessWebview?.createdAt ?? lastWebviewResponse?.createdAt ?? null,
        terminal: lastAccessTerminal?.createdAt ?? lastTerminalResponse?.createdAt ?? null,
        platform: user.lastAccess,
      },
      activityStatus,
      isActiveRecently,
      charts: {
        daily: Object.entries(dailyData).map(([date, count]) => ({ date, count })),
        hourly: hourlyData,
      },
      campaigns: campaignStats,
      accesses: {
        total: totalAccesses,
        completed: completedAccesses,
        conversionRate,
        last7Days: accesses7,
        last30Days: accesses30,
        last90Days: accesses90,
        bySource: accessSourceStats,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar estatísticas' },
      { status: 500 }
    );
  }
}
