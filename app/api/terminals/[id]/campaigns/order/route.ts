import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// PUT - Reordenar campanhas do terminal
export async function PUT(
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
    const { campaignIds } = body; // Array de IDs de TerminalCampaign na nova ordem

    if (!Array.isArray(campaignIds)) {
      return NextResponse.json(
        { error: "campaignIds deve ser um array" },
        { status: 400 }
      );
    }

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

    // Atualizar a ordem de cada campanha
    const updates = campaignIds.map((campaignId: string, index: number) =>
      prisma.terminalCampaign.update({
        where: {
          id: campaignId,
          terminalId: id,
        },
        data: {
          order: index,
        },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering terminal campaigns:", error);
    return NextResponse.json(
      { error: "Erro ao reordenar campanhas" },
      { status: 500 }
    );
  }
}
