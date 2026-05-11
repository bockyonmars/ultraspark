import { ApiProperty } from "@nestjs/swagger";
import { SupportTicketMessageType } from "@prisma/client";
import { IsEnum, IsString, MaxLength } from "class-validator";

export class CreateSupportTicketMessageDto {
  @ApiProperty({ enum: SupportTicketMessageType })
  @IsEnum(SupportTicketMessageType)
  type!: SupportTicketMessageType;

  @ApiProperty({ example: "Thanks for the update. We will follow up shortly." })
  @IsString()
  @MaxLength(5000)
  message!: string;
}
