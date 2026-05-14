import { Injectable } from '@nestjs/common';
import { CustomerActivityType } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type CreateCustomerActivityInput = {
  customerId?: string | null;
  type: CustomerActivityType;
  title: string;
  description?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdById?: string | null;
};

@Injectable()
export class CustomerActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateCustomerActivityInput) {
    return this.prisma.customerActivity.create({
      data: {
        customerId: input.customerId ?? undefined,
        type: input.type,
        title: input.title,
        description: input.description ?? undefined,
        relatedEntityType: input.relatedEntityType ?? undefined,
        relatedEntityId: input.relatedEntityId ?? undefined,
        createdById: input.createdById ?? undefined,
      },
    });
  }

  findForCustomer(customerId: string) {
    return this.prisma.customerActivity.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  findForEntity(entityType: string, entityId: string) {
    return this.prisma.customerActivity.findMany({
      where: {
        OR: [
          { relatedEntityType: entityType, relatedEntityId: entityId },
          ...(entityType === 'Invoice'
            ? [{ relatedEntityType: 'EmailLog', relatedEntityId: entityId }]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
