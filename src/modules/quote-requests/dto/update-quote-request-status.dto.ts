import { ApiProperty } from '@nestjs/swagger';
import { QuoteRequestStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateQuoteRequestStatusDto {
  @ApiProperty({ enum: QuoteRequestStatus })
  @IsEnum(QuoteRequestStatus)
  status!: QuoteRequestStatus;
}
