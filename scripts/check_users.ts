import prisma from '../lib/db';

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true, name: true, role: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
