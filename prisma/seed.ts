import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const serviceSeeds = [
  'Regular Home Cleaning',
  'Deep Cleaning',
  'End of Tenancy Cleaning',
  'Office Cleaning',
  'Carpet Cleaning',
  'Move In / Move Out Cleaning',
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  for (const name of serviceSeeds) {
    await prisma.service.upsert({
      where: { slug: slugify(name) },
      update: { name, isActive: true },
      create: {
        name,
        slug: slugify(name),
      },
    });
  }

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL;
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (seedAdminEmail && seedAdminPassword) {
    const passwordHash = await argon2.hash(seedAdminPassword);

    await prisma.adminUser.upsert({
      where: { email: seedAdminEmail },
      update: {
        passwordHash,
        isActive: true,
      },
      create: {
        email: seedAdminEmail,
        firstName: 'UltraSpark',
        lastName: 'Admin',
        passwordHash,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
