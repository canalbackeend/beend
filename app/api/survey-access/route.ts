import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Registrar acesso ao survey
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, terminalId, source, userAgent } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID obrigatório' }, { status: 400 });
    }

    // Criar registro de acesso
    const access = await prisma.surveyAccess.create({
      data: {
        campaignId,
        terminalId: terminalId || null,
        source: source || (terminalId ? 'TERMINAL' : 'WEBVIEW'),
        userAgent: userAgent || null,
        completed: false,
      },
    });

    return NextResponse.json({ accessId: access.id });
  } catch (error) {
    console.error('Error registering survey access:', error);
    return NextResponse.json({ error: 'Erro ao registrar acesso' }, { status: 500 });
  }
}

// PUT - Marcar acesso como completo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessId } = body;

    if (!accessId) {
      return NextResponse.json({ error: 'Access ID obrigatório' }, { status: 400 });
    }

    await prisma.surveyAccess.update({
      where: { id: accessId },
      data: { completed: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating survey access:', error);
    return NextResponse.json({ error: 'Erro ao atualizar acesso' }, { status: 500 });
  }
}
