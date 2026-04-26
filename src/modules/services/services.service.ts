import { Injectable } from '@nestjs/common';
import { Service } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { slugify } from '../../common/utils/public-form-payload.util';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findActiveServices() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
    });
  }

  async findByReference(reference: string) {
    const trimmed = reference.trim();
    const slug = slugify(trimmed);
    const services = await this.findActiveServices();

    return (
      services.find((service) => service.id === trimmed) ??
      services.find((service) => service.slug === slug) ??
      services.find((service) => service.name.toLowerCase() === trimmed.toLowerCase())
    );
  }

  async findDefaultQuoteService(): Promise<Service | null> {
    const preferred =
      (await this.findByReference('Home Cleaning')) ??
      (await this.findByReference('home-cleaning')) ??
      (await this.findByReference('home_cleaning'));

    if (preferred) {
      return preferred;
    }

    const services = await this.findActiveServices();
    return services[0] ?? null;
  }
}
