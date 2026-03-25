import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar todas as campanhas de email do usuário
export async function GET() {
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

    const campaigns = await prisma.emailCampaign.findMany({
      where: { userId: user.id },
      include: {
        terminal: {
          select: {
            id: true,
            name: true,
            campaigns: {
              include: {
                campaign: { select: { title: true } }
              },
              where: { isActive: true },
              orderBy: { order: 'asc' },
              take: 1,
            }
          }
        },
        contactList: {
          select: { id: true, name: true, _count: { select: { contacts: true } } }
        },
        _count: {
          select: { emailSends: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching email campaigns:', error);
    return NextResponse.json({ error: 'Erro ao carregar campanhas' }, { status: 500 });
  }
}

// POST - Criar nova campanha de email
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
    const { name, subject, previewText, bodyText, terminalId, contactListId } = body;

    if (!name || !subject || !bodyText || !terminalId) {
      return NextResponse.json(
        { error: 'Nome, assunto, texto e terminal são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o terminal pertence ao usuário
    const terminal = await prisma.terminal.findFirst({
      where: { id: terminalId, userId: user.id },
    });

    if (!terminal) {
      return NextResponse.json({ error: 'Terminal não encontrado' }, { status: 404 });
    }

    // Contar contatos da lista (se selecionada)
    let totalEmails = 0;
    if (contactListId) {
      const listCount = await prisma.contact.count({
        where: { listId: contactListId, userId: user.id }
      });
      totalEmails = listCount;
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        subject,
        previewText,
        bodyText,
        terminalId,
        contactListId: contactListId || null,
        totalEmails,
        userId: user.id,
      },
      include: {
        terminal: {
          select: {
            id: true,
            name: true,
            campaigns: {
              include: {
                campaign: { select: { title: true } }
              },
              where: { isActive: true },
              orderBy: { order: 'asc' },
              take: 1,
            }
          }
        },
        contactList: {
          select: { id: true, name: true }
        },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating email campaign:', error);
    return NextResponse.json({ error: 'Erro ao criar campanha' }, { status: 500 });
  }
}
