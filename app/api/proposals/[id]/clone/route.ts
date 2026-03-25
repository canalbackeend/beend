import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST - Clonar proposta
export async function POST(
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

    const originalProposal = await prisma.proposal.findFirst({
      where: {
        id: params.id,
        userId: user.role === 'ADMIN' ? undefined : user.id,
      },
      include: {
        items: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
      },
    });

    if (!originalProposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    // Gerar novo número da proposta
    const year = new Date().getFullYear();
    const lastProposal = await prisma.proposal.findFirst({
      where: { proposalNumber: { startsWith: `PROP-${year}` } },
      orderBy: { proposalNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastProposal) {
      const parts = lastProposal.proposalNumber.split('-');
      nextNumber = parseInt(parts[2] || '0', 10) + 1;
    }
    const proposalNumber = `PROP-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Criar cópia da proposta
    const clonedProposal = await prisma.proposal.create({
      data: {
        proposalNumber,
        clientName: `${originalProposal.clientName} (Cópia)`,
        clientContactPerson: originalProposal.clientContactPerson,
        clientEmail: originalProposal.clientEmail,
        clientPhone: originalProposal.clientPhone,
        clientCep: originalProposal.clientCep,
        clientAddress: originalProposal.clientAddress,
        proposalDate: new Date(),
        validUntil: originalProposal.validUntil ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) : null, // 10 dias
        status: 'DRAFT',
        templateId: originalProposal.templateId,
        greeting: originalProposal.greeting,
        generalDescription: originalProposal.generalDescription,
        implementationReqs: originalProposal.implementationReqs,
        technicalSupport: originalProposal.technicalSupport,
        warranty: originalProposal.warranty,
        systemFeatures: originalProposal.systemFeatures,
        paymentTerms: originalProposal.paymentTerms,
        finalConsiderations: originalProposal.finalConsiderations,
        planType: originalProposal.planType,
        planValue: originalProposal.planValue,
        planDescription: originalProposal.planDescription,
        shippingValue: originalProposal.shippingValue,
        totalValue: originalProposal.totalValue,
        signatureName: originalProposal.signatureName,
        signaturePhone: originalProposal.signaturePhone,
        userId: user.id,
        items: originalProposal.items.length > 0 ? {
          create: originalProposal.items.map((item, index) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            order: index,
          })),
        } : undefined,
        images: originalProposal.images.length > 0 ? {
          create: originalProposal.images.map((img, index) => ({
            imageUrl: img.imageUrl,
            caption: img.caption,
            imageType: img.imageType,
            order: index,
          })),
        } : undefined,
      },
      include: {
        items: true,
        images: true,
        template: true,
      },
    });

    return NextResponse.json(clonedProposal, { status: 201 });
  } catch (error) {
    console.error('Error cloning proposal:', error);
    return NextResponse.json({ error: 'Erro ao clonar proposta' }, { status: 500 });
  }
}
