import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type CustomerInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrMatch(input: CustomerInput): Promise<Customer> {
    const email = input.email?.trim().toLowerCase();
    const phone = input.phone?.trim();

    if (!email && !phone) {
      throw new Error('Either email or phone is required');
    }

    const existing = await this.prisma.customer.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      return this.prisma.customer.update({
        where: { id: existing.id },
        data: {
          firstName: input.firstName ?? existing.firstName,
          lastName: input.lastName ?? existing.lastName,
          email: email ?? existing.email,
          phone: phone ?? existing.phone,
        },
      });
    }

    return this.prisma.customer.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        phone,
      },
    });
  }

  findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            contactMessages: true,
            quoteRequests: true,
            bookingRequests: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        contactMessages: {
          orderBy: { createdAt: 'desc' },
        },
        quoteRequests: {
          orderBy: { createdAt: 'desc' },
          include: { service: true },
        },
        bookingRequests: {
          orderBy: { createdAt: 'desc' },
          include: { service: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }
}
