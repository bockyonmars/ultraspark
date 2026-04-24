import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import appConfig from './config/app.config';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ContactMessagesModule } from './modules/contact-messages/contact-messages.module';
import { QuoteRequestsModule } from './modules/quote-requests/quote-requests.module';
import { BookingRequestsModule } from './modules/booking-requests/booking-requests.module';
import { ServicesModule } from './modules/services/services.module';
import { EmailModule } from './modules/email/email.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 15,
      },
    ]),
    PrismaModule,
    AuthModule,
    AdminUsersModule,
    CustomersModule,
    ContactMessagesModule,
    QuoteRequestsModule,
    BookingRequestsModule,
    ServicesModule,
    EmailModule,
    AnalyticsModule,
    AuditLogsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
