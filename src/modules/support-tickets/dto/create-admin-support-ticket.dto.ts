import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateAdminSupportTicketDto {
  @ApiProperty({ example: "Sarah Johnson" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  customerName!: string;

  @ApiProperty({ example: "sarah@example.com" })
  @IsEmail()
  @MaxLength(200)
  customerEmail!: string;

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

  @ApiPropertyOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiProperty({ example: "Issue with recent clean" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ example: "Please review the bathroom cleaning quality." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ example: "manual_admin" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiPropertyOptional({ description: "Admin user id to assign at creation" })
  @IsOptional()
  @IsString()
  assignedToAdminId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedBookingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedQuoteId?: string;
}
