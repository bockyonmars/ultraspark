import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AdminUsersService } from '../admin-users/admin-users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async login(loginDto: LoginDto) {
    const adminUser = await this.adminUsersService.findByEmail(loginDto.email);

    if (!adminUser || !adminUser.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await argon2.verify(adminUser.passwordHash, loginDto.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.adminUsersService.updateLastLogin(adminUser.id);
    await this.auditLogsService.create({
      action: 'ADMIN_LOGIN',
      entityType: 'AdminUser',
      entityId: adminUser.id,
      description: `Admin user ${adminUser.email} logged in`,
      adminUserId: adminUser.id,
      metadata: {
        email: adminUser.email,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: adminUser.id,
      email: adminUser.email,
    });

    return {
      accessToken,
      adminUser: this.adminUsersService.sanitize(adminUser),
    };
  }
}
