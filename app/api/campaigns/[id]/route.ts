import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar campanha específica
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: { orderBy: { order: 'asc' } },
          },
        },
        user: { select: { email: true, name: true } },
        _count: { select: { responses: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Erro ao buscar campanha' }, { status: 500 });
  }
}

// PUT - Atualizar campanha
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Campanha não encontrada ou sem permissão' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, status, questions, lgpdText, collectName, collectPhone, collectEmail } = body;

    // Atualizar campanha
    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        title: title || campaign.title,
        description: description !== undefined ? description : campaign.description,
        status: status || campaign.status,
        lgpdText: lgpdText !== undefined ? lgpdText : campaign.lgpdText,
        collectName: collectName !== undefined ? collectName : campaign.collectName,
        collectPhone: collectPhone !== undefined ? collectPhone : campaign.collectPhone,
        collectEmail: collectEmail !== undefined ? collectEmail : campaign.collectEmail,
      },
    });

    // Se houver perguntas, atualizar
    if (questions && Array.isArray(questions)) {
      // Resetar todas as respostas da campanha para manter consistência
      // (ao mudar perguntas, as respostas antigas não fazem mais sentido)
      await prisma.response.deleteMany({
        where: { campaignId: params.id },
      });
      
      // Deletar perguntas antigas (cascade deleta as opções também)
      await prisma.question.deleteMany({
        where: { campaignId: params.id },
      });

      // Criar novas perguntas com opções
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await prisma.question.create({
          data: {
            campaignId: params.id,
            text: q.text,
            type: q.type || 'SMILE',
            isRequired: q.isRequired !== undefined ? q.isRequired : true,
            allowOptionalComment: q.allowOptionalComment !== undefined ? q.allowOptionalComment : false,
            order: q.order || i + 1,
            scaleMin: q.scaleMin,
            scaleMax: q.scaleMax,
            scaleMinLabel: q.scaleMinLabel,
            scaleMaxLabel: q.scaleMaxLabel,
            options: q.options && q.options.length > 0 ? {
              create: q.options.map((opt: any, idx: number) => ({
                text: opt.text,
                color: opt.color || '#3b82f6',
                imageUrl: opt.imageUrl,
                order: opt.order ?? idx + 1,
              })),
            } : undefined,
          },
        });
      }
    }

    const result = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Erro ao atualizar campanha' }, { status: 500 });
  }
}

// DELETE - Deletar campanha
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Campanha não encontrada ou sem permissão' }, { status: 404 });
    }

    await prisma.campaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Erro ao deletar campanha' }, { status: 500 });
  }
}
