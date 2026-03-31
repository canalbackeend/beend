import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole, CampaignStatus, QuestionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting seed...');

    // Criar usuário de teste padrão (admin)
    const hashedPassword1 = await bcrypt.hash('johndoe123', 10);
    const testUser = await prisma.user.upsert({
      where: { email: 'john@doe.com' },
      update: {},
      create: {
        email: 'john@doe.com',
        password: hashedPassword1,
        name: 'John Doe',
        role: UserRole.ADMIN,
      },
    });
    console.log('✅ Test user created:', testUser.email);

    // Criar usuário admin adicional
    const hashedPassword2 = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@pesquisa.com' },
      update: {},
      create: {
        email: 'admin@pesquisa.com',
        password: hashedPassword2,
        name: 'Administrador',
        role: UserRole.ADMIN,
      },
    });
    console.log('✅ Admin user created:', adminUser.email);

    // Criar usuário regular
    const hashedPassword3 = await bcrypt.hash('user123', 10);
    const regularUser = await prisma.user.upsert({
      where: { email: 'usuario@pesquisa.com' },
      update: {},
      create: {
        email: 'usuario@pesquisa.com',
        password: hashedPassword3,
        name: 'Usuário Regular',
        role: UserRole.USER,
      },
    });
    console.log('✅ Regular user created:', regularUser.email);

    console.log('🎉 Seed completed!');

    return NextResponse.json({ 
      success: true, 
      users: [
        { email: 'john@doe.com', password: 'johndoe123', role: 'ADMIN' },
        { email: 'admin@pesquisa.com', password: 'admin123', role: 'ADMIN' },
        { email: 'usuario@pesquisa.com', password: 'user123', role: 'USER' }
      ]
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
