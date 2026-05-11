import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SupportTicketCategory, SupportTicketPriority } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateSupportTicketDto {
  @ApiProperty({ example: "Sarah Johnson" })
  @IsString()
  @MaxLength(200)
  customerName!: string;

  @ApiPropertyOptional({ example: "sarah@example.com" })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ example: "+447900123456" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @ApiPropertyOptional({ enum: SupportTicketCategory })
  @IsOptional()
  @IsEnum(SupportTicketCategory)
  category?: SupportTicketCategory;

  @ApiPropertyOptional({ enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @ApiProperty({ example: "Issue with recent clean" })
  @IsString()
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ example: "Please review the bathroom cleaning quality." })
  @IsString()
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ example: "website-support-form" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedBookingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedQuoteId?: string;
}
