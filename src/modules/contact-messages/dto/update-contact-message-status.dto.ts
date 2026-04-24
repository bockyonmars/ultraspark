import { ApiProperty } from '@nestjs/swagger';
import { ContactMessageStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateContactMessageStatusDto {
  @ApiProperty({ enum: ContactMessageStatus })
  @IsEnum(ContactMessageStatus)
  status!: ContactMessageStatus;
}
