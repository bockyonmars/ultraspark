import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findById(id: string) {
    return this.prisma.adminUser.findUnique({
      where: { id },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.adminUser.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  sanitize(adminUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return adminUser;
  }
}
