import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CustomerActivitiesModule } from '../customer-activities/customer-activities.module';
import { CustomersModule } from '../customers/customers.module';
import { EmailModule } from '../email/email.module';
import { ServicesModule } from '../services/services.module';
import { BookingRequestsController } from './booking-requests.controller';
import { BookingRequestsService } from './booking-requests.service';

@Module({
  imports: [
    CustomersModule,
    ServicesModule,
    EmailModule,
    CustomerActivitiesModule,
    AnalyticsModule,
    AuditLogsModule,
  ],
  controllers: [BookingRequestsController],
  providers: [BookingRequestsService],
  exports: [BookingRequestsService],
})
export class BookingRequestsModule {}
