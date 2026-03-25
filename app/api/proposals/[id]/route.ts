import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET - Obter proposta específica
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

    const proposal = await prisma.proposal.findFirst({
      where: {
        id: params.id,
        userId: user.role === 'ADMIN' ? undefined : user.id,
      },
      include: {
        items: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
        template: true,
        user: {
          select: {
            name: true,
            companyName: true,
            cnpj: true,
            logoUrl: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json({ error: 'Erro ao carregar proposta' }, { status: 500 });
  }
}

// PUT - Atualizar proposta
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

    const existingProposal = await prisma.proposal.findFirst({
      where: {
        id: params.id,
        userId: user.role === 'ADMIN' ? undefined : user.id,
      },
    });

    if (!existingProposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const {
      clientName,
      clientContactPerson,
      clientEmail,
      clientPhone,
      clientCep,
      clientAddress,
      proposalDate,
      validUntil,
      status,
      templateId,
      greeting,
      generalDescription,
      implementationReqs,
      technicalSupport,
      warranty,
      systemFeatures,
      paymentTerms,
      finalConsiderations,
      planType,
      planValue,
      planDescription,
      shippingValue,
      signatureName,
      signaturePhone,
      items,
      images,
    } = body;

    // Calcular total (incluindo frete individual de cada item)
    let totalValue = new Prisma.Decimal(0);
    if (items && Array.isArray(items)) {
      for (const item of items) {
        totalValue = totalValue.add(new Prisma.Decimal(item.subtotal || 0));
        if (item.shippingValue) {
          totalValue = totalValue.add(new Prisma.Decimal(item.shippingValue));
        }
      }
    }
    if (planValue) {
      totalValue = totalValue.add(new Prisma.Decimal(planValue));
    }
    if (shippingValue) {
      totalValue = totalValue.add(new Prisma.Decimal(shippingValue));
    }

    // Atualizar proposta
    const proposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        clientName,
        clientContactPerson,
        clientEmail,
        clientPhone,
        clientCep,
        clientAddress,
        proposalDate: proposalDate ? new Date(proposalDate) : undefined,
        validUntil: validUntil ? new Date(validUntil) : null,
        status,
        templateId,
        greeting,
        generalDescription,
        implementationReqs,
        technicalSupport,
        warranty,
        systemFeatures,
        paymentTerms,
        finalConsiderations,
        planType,
        planValue: planValue !== undefined ? (planValue ? new Prisma.Decimal(planValue) : null) : undefined,
        planDescription,
        shippingValue: shippingValue !== undefined ? (shippingValue ? new Prisma.Decimal(shippingValue) : null) : undefined,
        totalValue,
        signatureName,
        signaturePhone,
      },
    });

    // Atualizar itens se fornecidos
    if (items !== undefined) {
      await prisma.proposalItem.deleteMany({ where: { proposalId: params.id } });
      if (items && items.length > 0) {
        await prisma.proposalItem.createMany({
          data: items.map((item: any, index: number) => ({
            proposalId: params.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
            subtotal: new Prisma.Decimal(item.subtotal || 0),
            shippingValue: item.shippingValue ? new Prisma.Decimal(item.shippingValue) : null,
            order: index,
          })),
        });
      }
    }

    // Atualizar imagens se fornecidas
    if (images !== undefined) {
      await prisma.proposalImage.deleteMany({ where: { proposalId: params.id } });
      if (images && images.length > 0) {
        await prisma.proposalImage.createMany({
          data: images.map((img: any, index: number) => ({
            proposalId: params.id,
            imageUrl: img.imageUrl,
            caption: img.caption,
            imageType: img.imageType,
            order: index,
          })),
        });
      }
    }

    const updatedProposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        items: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
        template: true,
      },
    });

    return NextResponse.json(updatedProposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: 'Erro ao atualizar proposta' }, { status: 500 });
  }
}

// DELETE - Excluir proposta
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

    const existingProposal = await prisma.proposal.findFirst({
      where: {
        id: params.id,
        userId: user.role === 'ADMIN' ? undefined : user.id,
      },
    });

    if (!existingProposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    await prisma.proposal.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json({ error: 'Erro ao excluir proposta' }, { status: 500 });
  }
}
