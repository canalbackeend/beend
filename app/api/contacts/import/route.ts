import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ImportRow {
  email: string;
  name?: string;
  phone?: string;
  company?: string;
}

// POST - Importar contatos via CSV
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
    const { contacts, listId }: { contacts: ImportRow[]; listId?: string } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'Nenhum contato para importar' }, { status: 400 });
    }

    // Validar e filtrar emails válidos
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validContacts = contacts.filter(c => c.email && emailRegex.test(c.email.trim()));

    if (validContacts.length === 0) {
      return NextResponse.json({ error: 'Nenhum email válido encontrado' }, { status: 400 });
    }

    // Buscar emails já existentes
    const existingEmails = await prisma.contact.findMany({
      where: {
        userId: user.id,
        email: { in: validContacts.map(c => c.email.trim().toLowerCase()) }
      },
      select: { email: true }
    });

    const existingEmailSet = new Set(existingEmails.map(e => e.email.toLowerCase()));

    // Filtrar contatos novos
    const newContacts = validContacts.filter(
      c => !existingEmailSet.has(c.email.trim().toLowerCase())
    );

    if (newContacts.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        duplicates: validContacts.length,
        message: 'Todos os contatos já existem na base'
      });
    }

    // Criar contatos em batch
    const result = await prisma.contact.createMany({
      data: newContacts.map(c => ({
        email: c.email.trim().toLowerCase(),
        name: c.name?.trim() || null,
        phone: c.phone?.trim() || null,
        company: c.company?.trim() || null,
        listId: listId || null,
        userId: user.id,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      imported: result.count,
      duplicates: validContacts.length - result.count,
      total: contacts.length,
      invalid: contacts.length - validContacts.length,
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    return NextResponse.json({ error: 'Erro ao importar contatos' }, { status: 500 });
  }
}
