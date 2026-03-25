import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { serialize } from 'cookie';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

// POST - Login do terminal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar terminal pelo email
    const terminal = await prisma.terminal.findUnique({
      where: { email },
      include: {
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!terminal) {
      return NextResponse.json(
        { error: 'Terminal não encontrado' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, terminal.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Pegar primeira campanha ativa (para compatibilidade)
    const firstCampaign = terminal.campaigns[0]?.campaign || null;

    // Criar token JWT
    const token = sign(
      {
        terminalId: terminal.id,
        terminalName: terminal.name,
        terminalEmail: terminal.email,
        campaignId: firstCampaign?.id || null,
        userId: terminal.userId,
        type: 'terminal',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Criar resposta com cookie
    const response = NextResponse.json({
      terminal: {
        id: terminal.id,
        name: terminal.name,
        email: terminal.email,
        campaigns: terminal.campaigns.map(tc => tc.campaign),
        campaign: firstCampaign, // Para compatibilidade
        user: terminal.user,
      },
    });

    // Definir cookie
    response.headers.set(
      'Set-Cookie',
      serialize('terminal-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: '/',
      })
    );

    return response;
  } catch (error) {
    console.error('Error in terminal login:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}

// DELETE - Logout do terminal
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Remover cookie
  response.headers.set(
    'Set-Cookie',
    serialize('terminal-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
  );

  return response;
}
