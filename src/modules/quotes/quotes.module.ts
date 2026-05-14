import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CustomerActivitiesModule } from '../customer-activities/customer-activities.module';
import { CustomersModule } from '../customers/customers.module';
import { EmailModule } from '../email/email.module';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [CustomersModule, EmailModule, CustomerActivitiesModule, AuditLogsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
