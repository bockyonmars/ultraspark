import { Module } from "@nestjs/common";
import { AnalyticsModule } from "../analytics/analytics.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { CustomersModule } from "../customers/customers.module";
import { EmailModule } from "../email/email.module";
import { PrismaModule } from "../prisma.module";
import { SupportTicketsController } from "./support-tickets.controller";
import { SupportTicketsService } from "./support-tickets.service";

@Module({
  imports: [
    PrismaModule,
    CustomersModule,
    EmailModule,
    AnalyticsModule,
    AuditLogsModule,
  ],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService],
  exports: [SupportTicketsService],
})
export class SupportTicketsModule {}
