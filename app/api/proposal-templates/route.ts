import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar todos os templates do usuário
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

    const templates = await prisma.proposalTemplate.findMany({
      where: {
        userId: user.role === 'ADMIN' ? undefined : user.id,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Erro ao carregar templates' }, { status: 500 });
  }
}

// POST - Criar novo template
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
    const {
      name,
      description,
      generalDescription,
      implementationReqs,
      technicalSupport,
      warranty,
      systemFeatures,
      paymentTerms,
      finalConsiderations,
      defaultItems,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome do template é obrigatório' }, { status: 400 });
    }

    const template = await prisma.proposalTemplate.create({
      data: {
        name,
        description,
        generalDescription,
        implementationReqs,
        technicalSupport,
        warranty,
        systemFeatures,
        paymentTerms,
        finalConsiderations,
        defaultItems,
        userId: user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 });
  }
}
