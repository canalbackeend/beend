import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar pacotes de email
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const packages = await prisma.emailPackage.findMany({
      orderBy: { credits: 'asc' },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching email packages:', error);
    return NextResponse.json({ error: 'Erro ao carregar pacotes' }, { status: 500 });
  }
}

// POST - Criar pacote
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, credits, price, description, isActive } = body;

    if (!name || !credits || price === undefined) {
      return NextResponse.json({ 
        error: 'Nome, créditos e preço são obrigatórios' 
      }, { status: 400 });
    }

    const pkg = await prisma.emailPackage.create({
      data: {
        name,
        credits: parseInt(credits),
        price: parseFloat(price),
        description: description || null,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    console.error('Error creating email package:', error);
    return NextResponse.json({ error: 'Erro ao criar pacote' }, { status: 500 });
  }
}
