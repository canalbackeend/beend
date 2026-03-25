import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar campanha específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, userId: user.id },
      include: {
        terminal: {
          include: {
            campaigns: {
              include: {
                campaign: {
                  select: { title: true, uniqueLink: true }
                }
              },
              where: { isActive: true },
              orderBy: { order: 'asc' },
              take: 1,
            }
          }
        },
        contactList: {
          include: { contacts: true }
        },
        emailSends: {
          include: { contact: true },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching email campaign:', error);
    return NextResponse.json({ error: 'Erro ao carregar campanha' }, { status: 500 });
  }
}

// PUT - Atualizar campanha
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existing = await prisma.emailCampaign.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    // Não permite editar campanha já enviada
    if (existing.status === 'SENT' || existing.status === 'SENDING') {
      return NextResponse.json(
        { error: 'Não é possível editar uma campanha já enviada' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, subject, previewText, bodyText, terminalId, contactListId, status } = body;

    // Recalcular total de emails se lista mudou
    let totalEmails = existing.totalEmails;
    if (contactListId && contactListId !== existing.contactListId) {
      const listCount = await prisma.contact.count({
        where: { listId: contactListId, userId: user.id }
      });
      totalEmails = listCount;
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        name,
        subject,
        previewText,
        bodyText,
        terminalId,
        contactListId: contactListId || null,
        totalEmails,
        status,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating email campaign:', error);
    return NextResponse.json({ error: 'Erro ao atualizar campanha' }, { status: 500 });
  }
}

// DELETE - Excluir campanha
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existing = await prisma.emailCampaign.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    await prisma.emailCampaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email campaign:', error);
    return NextResponse.json({ error: 'Erro ao excluir campanha' }, { status: 500 });
  }
}
