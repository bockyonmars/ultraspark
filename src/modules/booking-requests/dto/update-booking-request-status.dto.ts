import { ApiProperty } from '@nestjs/swagger';
import { BookingRequestStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBookingRequestStatusDto {
  @ApiProperty({ enum: BookingRequestStatus })
  @IsEnum(BookingRequestStatus)
  status!: BookingRequestStatus;
}
