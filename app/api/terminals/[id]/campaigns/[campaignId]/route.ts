import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// PUT - Atualizar configurações de uma campanha no terminal
export async function PUT(
  request: Request,
  { params }: { params: { id: string; campaignId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id, campaignId } = params;
    const body = await request.json();
    const { icon, color, customTitle, description, isActive } = body;

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

    // Atualizar a relação
    const updated = await prisma.terminalCampaign.update({
      where: {
        id: campaignId,
        terminalId: id,
      },
      data: {
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(customTitle !== undefined && { customTitle }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        campaign: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating terminal campaign:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar campanha do terminal" },
      { status: 500 }
    );
  }
}

// DELETE - Remover campanha do terminal
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; campaignId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id, campaignId } = params;

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

    // Remover a relação
    await prisma.terminalCampaign.delete({
      where: {
        id: campaignId,
        terminalId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing campaign from terminal:", error);
    return NextResponse.json(
      { error: "Erro ao remover campanha do terminal" },
      { status: 500 }
    );
  }
}
