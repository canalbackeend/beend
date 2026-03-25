import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { logActivity, ActivityAction, EntityType } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

// GET - Listar todas as campanhas do usuário
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

    // Verificar se estamos visualizando como outro usuário (apenas admins)
    const { searchParams } = new URL(request.url);
    const viewAsUserId = searchParams.get('viewAsUser');
    
    let targetUserId = user.id;
    let targetUser = user;

    if (viewAsUserId && user.role === 'ADMIN') {
      // Admin pode visualizar dados de outro usuário
      const viewUser = await prisma.user.findUnique({
        where: { id: viewAsUserId },
      });

      if (!viewUser) {
        return NextResponse.json({ error: 'Usuário alvo não encontrado' }, { status: 404 });
      }

      targetUserId = viewUser.id;
      targetUser = viewUser;
    }

    const campaigns = await prisma.campaign.findMany({
      where: { userId: targetUserId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Se estamos visualizando como outro usuário, retornar também info do usuário
    if (viewAsUserId && user.role === 'ADMIN') {
      return NextResponse.json({
        campaigns,
        userInfo: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },
      });
    }

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Erro ao buscar campanhas' }, { status: 500 });
  }
}

// POST - Criar nova campanha
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
    const { title, description, questions, lgpdText, collectName, collectPhone, collectEmail } = body;

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Criar campanha e perguntas
    const campaign = await prisma.campaign.create({
      data: {
        title,
        description: description || null,
        lgpdText: lgpdText || null,
        collectName: collectName || false,
        collectPhone: collectPhone || false,
        collectEmail: collectEmail || false,
        userId: user.id,
        questions: {
          create: questions.map((q: any, index: number) => ({
            text: q.text,
            order: index + 1,
            type: q.type,
            isRequired: q.isRequired !== undefined ? q.isRequired : true,
            allowOptionalComment: q.allowOptionalComment !== undefined ? q.allowOptionalComment : false,
            scaleMin: q.scaleMin,
            scaleMax: q.scaleMax,
            scaleMinLabel: q.scaleMinLabel,
            scaleMaxLabel: q.scaleMaxLabel,
            options: q.options && q.options.length > 0 ? {
              create: q.options.map((opt: any, optIndex: number) => ({
                text: opt.text,
                color: opt.color || '#3b82f6',
                imageUrl: opt.imageUrl || null,
                order: optIndex + 1,
              })),
            } : undefined,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });

    // Registrar atividade
    await logActivity({
      userId: user.id,
      action: ActivityAction.CREATE_CAMPAIGN,
      entityType: EntityType.CAMPAIGN,
      entityId: campaign.id,
      entityName: campaign.title,
      description: `Criou a campanha "${campaign.title}" com ${questions.length} pergunta(s)`,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Erro ao criar campanha' }, { status: 500 });
  }
}
