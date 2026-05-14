import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CustomerActivitiesModule } from '../customer-activities/customer-activities.module';
import { CustomersModule } from '../customers/customers.module';
import { EmailModule } from '../email/email.module';
import { StorageModule } from '../storage/storage.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    CustomersModule,
    EmailModule,
    StorageModule,
    CustomerActivitiesModule,
    AuditLogsModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
