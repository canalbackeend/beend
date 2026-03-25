import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Obter template específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const template = await prisma.proposalTemplate.findFirst({
      where: {
        id: params.id,
        userId: user.role === 'ADMIN' ? undefined : user.id,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Erro ao carregar template' }, { status: 500 });
  }
}

// PUT - Atualizar template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingTemplate = await prisma.proposalTemplate.findFirst({
      where: {
        id: params.id,
        userId: user.role === 'ADMIN' ? undefined : user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
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
      isActive,
    } = body;

    const template = await prisma.proposalTemplate.update({
      where: { id: params.id },
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
        isActive,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 });
  }
}

// DELETE - Excluir template (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingTemplate = await prisma.proposalTemplate.findFirst({
      where: {
        id: params.id,
        userId: user.role === 'ADMIN' ? undefined : user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Soft delete - apenas desativa
    await prisma.proposalTemplate.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Erro ao excluir template' }, { status: 500 });
  }
}
