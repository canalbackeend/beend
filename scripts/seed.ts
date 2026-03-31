import { PrismaClient, UserRole, CampaignStatus, QuestionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    },
  },
});

async function main() {
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

  // Criar campanha com tipos mistos
  const mixedCampaign = await prisma.campaign.create({
    data: {
      title: 'Pesquisa de Satisfação Completa',
      description: 'Avalie sua experiência com diferentes tipos de perguntas',
      status: CampaignStatus.ACTIVE,
      userId: testUser.id,
      questions: {
        create: [
          {
            text: 'Como você avalia a qualidade do atendimento?',
            type: QuestionType.SMILE,
            order: 1,
          },
          {
            text: 'Qual a probabilidade de você recomendar nosso serviço?',
            type: QuestionType.NPS,
            order: 2,
          },
          {
            text: 'Qual foi o principal motivo da sua visita?',
            type: QuestionType.SINGLE_CHOICE,
            order: 3,
            options: {
              create: [
                { text: 'Compras', order: 1 },
                { text: 'Apenas olhando', order: 2 },
                { text: 'Trocar produto', order: 3 },
                { text: 'Reclamação', order: 4 },
              ],
            },
          },
          {
            text: 'Como você avalia nosso produto (de 1 a 5)?',
            type: QuestionType.SCALE,
            order: 4,
            scaleMin: 1,
            scaleMax: 5,
            scaleMinLabel: 'Ruim',
            scaleMaxLabel: 'Excelente',
          },
        ],
      },
    },
  });
  console.log('✅ Mixed campaign created:', mixedCampaign.title);

  // Criar algumas respostas de exemplo
  for (let i = 0; i < 10; i++) {
    const response = await prisma.response.create({
      data: {
        campaignId: mixedCampaign.id,
        respondentEmail: i % 2 === 0 ? `user${i}@example.com` : null,
        answers: {
          create: [
            {
              questionId: (await prisma.question.findFirst({ where: { campaignId: mixedCampaign.id, order: 1 } }))!.id,
              rating: Math.floor(Math.random() * 5) + 1,
              selectedOptions: [],
              comment: i % 3 === 0 ? 'Atendimento muito bom!' : null,
            },
            {
              questionId: (await prisma.question.findFirst({ where: { campaignId: mixedCampaign.id, order: 2 } }))!.id,
              rating: Math.floor(Math.random() * 11),
              selectedOptions: [],
              comment: i % 4 === 0 ? 'Produto excelente, recomendo!' : null,
            },
            {
              questionId: (await prisma.question.findFirst({ where: { campaignId: mixedCampaign.id, order: 3 } }))!.id,
              rating: null,
              selectedOptions: [(await prisma.questionOption.findFirst({ where: { questionId: (await prisma.question.findFirst({ where: { campaignId: mixedCampaign.id, order: 3 } }))!.id } }))!.id],
              comment: null,
            },
            {
              questionId: (await prisma.question.findFirst({ where: { campaignId: mixedCampaign.id, order: 4 } }))!.id,
              rating: Math.floor(Math.random() * 5) + 1,
              selectedOptions: [],
              comment: null,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Sample responses created');

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
