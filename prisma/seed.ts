import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const serviceSeeds = [
  { name: 'Home Cleaning', slug: 'home-cleaning' },
  { name: 'Office Cleaning', slug: 'office-cleaning' },
  { name: 'Deep Cleaning', slug: 'deep-cleaning' },
  { name: 'End of Tenancy Cleaning', slug: 'end-of-tenancy-cleaning' },
  { name: 'AirBnB Cleaning', slug: 'airbnb-cleaning' },
] as const;

const legacyServiceAliases = [
  {
    legacyName: 'Regular Home Cleaning',
    legacySlug: 'regular-home-cleaning',
    replacementName: 'Home Cleaning',
    replacementSlug: 'home-cleaning',
  },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  for (const alias of legacyServiceAliases) {
    const legacy = await prisma.service.findFirst({
      where: {
        OR: [
          { slug: alias.legacySlug },
          { name: alias.legacyName },
        ],
      },
    });

    if (legacy) {
      await prisma.service.update({
        where: { id: legacy.id },
        data: {
          name: alias.replacementName,
          slug: alias.replacementSlug,
          isActive: true,
        },
      });
    }
  }

  for (const service of serviceSeeds) {
    const existing = await prisma.service.findFirst({
      where: {
        OR: [
          { slug: service.slug },
          { name: service.name },
        ],
      },
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          name: service.name,
          slug: service.slug,
          isActive: true,
        },
      });
      continue;
    }

    await prisma.service.create({
      data: {
        name: service.name,
        slug: service.slug,
        isActive: true,
      },
    });
  }

  await prisma.service.updateMany({
    where: {
      slug: {
        notIn: serviceSeeds.map((service) => service.slug),
      },
    },
    data: {
      isActive: false,
    },
  });

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
