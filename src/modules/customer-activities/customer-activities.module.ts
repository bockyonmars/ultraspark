import { Module } from '@nestjs/common';
import { CustomerActivitiesService } from './customer-activities.service';

@Module({
  providers: [CustomerActivitiesService],
  exports: [CustomerActivitiesService],
})
export class CustomerActivitiesModule {}
