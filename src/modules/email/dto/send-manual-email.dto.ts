import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

export class SendManualEmailDto {
  @IsEmail()
  recipientEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  recipientName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  messageHtml!: string;

  @IsOptional()
  @IsString()
  plainText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ctaLabel?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  ctaUrl?: string;

  @IsOptional()
  @IsString()
  relatedTicketId?: string;

  @IsOptional()
  @IsString()
  relatedCustomerId?: string;

  @IsOptional()
  @IsString()
  relatedContactMessageId?: string;

  @IsOptional()
  @IsString()
  relatedQuoteId?: string;

  @IsOptional()
  @IsString()
  relatedBookingId?: string;
}
