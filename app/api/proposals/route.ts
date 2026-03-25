import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET - Listar todas as propostas do usuário (ou todas para admin)
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Prisma.ProposalWhereInput = {
      userId: user.role === 'ADMIN' ? undefined : user.id,
    };

    if (status && status !== 'all') {
      where.status = status as any;
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { proposalNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        template: { select: { name: true } },
        items: true,
        images: true,
        user: { select: { name: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Erro ao carregar propostas' }, { status: 500 });
  }
}

// POST - Criar nova proposta
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
      clientName,
      clientContactPerson,
      clientEmail,
      clientPhone,
      clientCep,
      clientAddress,
      proposalDate,
      validUntil,
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

    if (!clientName) {
      return NextResponse.json({ error: 'Nome do cliente é obrigatório' }, { status: 400 });
    }

    // Gerar número da proposta
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

    const proposal = await prisma.proposal.create({
      data: {
        proposalNumber,
        clientName,
        clientContactPerson,
        clientEmail,
        clientPhone,
        clientCep,
        clientAddress,
        proposalDate: proposalDate ? new Date(proposalDate) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
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
        planValue: planValue ? new Prisma.Decimal(planValue) : null,
        planDescription,
        shippingValue: shippingValue ? new Prisma.Decimal(shippingValue) : null,
        totalValue,
        signatureName: signatureName || user.responsiblePerson || user.name,
        signaturePhone,
        userId: user.id,
        items: items && items.length > 0 ? {
          create: items.map((item: any, index: number) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
            subtotal: new Prisma.Decimal(item.subtotal || 0),
            shippingValue: item.shippingValue ? new Prisma.Decimal(item.shippingValue) : null,
            order: index,
          })),
        } : undefined,
        images: images && images.length > 0 ? {
          create: images.map((img: any, index: number) => ({
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

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Erro ao criar proposta' }, { status: 500 });
  }
}
