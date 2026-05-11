import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class AssignSupportTicketDto {
  @ApiPropertyOptional({ description: "Admin user id, or omit to unassign" })
  @IsOptional()
  @IsString()
  assignedToAdminId?: string | null;
}
