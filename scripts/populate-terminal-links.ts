import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateUniqueLink() {
  return randomBytes(10).toString('hex');
}

async function main() {
  const terminals = await prisma.terminal.findMany({
    where: {
      uniqueLink: null,
    },
  });

  console.log(`Found ${terminals.length} terminals without uniqueLink`);

  for (const terminal of terminals) {
    const uniqueLink = generateUniqueLink();
    await prisma.terminal.update({
      where: { id: terminal.id },
      data: { uniqueLink },
    });
    console.log(`Updated terminal ${terminal.name} with uniqueLink: ${uniqueLink}`);
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
