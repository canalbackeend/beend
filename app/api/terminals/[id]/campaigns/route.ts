import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - Listar campanhas de um terminal
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const campaigns = await prisma.terminalCampaign.findMany({
      where: {
        terminalId: id,
        isActive: true,
      },
      include: {
        campaign: {
          include: {
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
                order: "asc",
              },
            },
            _count: {
              select: {
                responses: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching terminal campaigns:", error);
    return NextResponse.json(
      { error: "Erro ao buscar campanhas do terminal" },
      { status: 500 }
    );
  }
}

// POST - Adicionar campanha ao terminal
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { campaignId, icon, color, customTitle, description } = body;

    // Verificar se o terminal pertence ao usuário
    const terminal = await prisma.terminal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!terminal) {
      return NextResponse.json(
        { error: "Terminal não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se a campanha pertence ao usuário
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: session.user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se já existe essa relação
    const existing = await prisma.terminalCampaign.findUnique({
      where: {
        terminalId_campaignId: {
          terminalId: id,
          campaignId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Esta campanha já está vinculada ao terminal" },
        { status: 400 }
      );
    }

    // Obter a próxima ordem
    const maxOrder = await prisma.terminalCampaign.aggregate({
      where: { terminalId: id },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    // Criar a relação
    const terminalCampaign = await prisma.terminalCampaign.create({
      data: {
        terminalId: id,
        campaignId,
        order: nextOrder,
        icon: icon || "faChartBar",
        color: color || "#3b82f6",
        customTitle: customTitle || null,
        description: description || null,
      },
      include: {
        campaign: true,
      },
    });

    return NextResponse.json(terminalCampaign, { status: 201 });
  } catch (error) {
    console.error("Error adding campaign to terminal:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar campanha ao terminal" },
      { status: 500 }
    );
  }
}
