import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentAdmin } from "../../common/decorators/current-admin.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SendManualEmailDto } from "./dto/send-manual-email.dto";
import { EmailService } from "./email.service";

@ApiTags("Emails")
@Controller({ path: "emails", version: "1" })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post("manual")
  @ApiOperation({ summary: "Send a manual branded customer email" })
  async sendManualEmail(
    @Body() sendManualEmailDto: SendManualEmailDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const result = await this.emailService.sendManualCustomerReply({
      ...sendManualEmailDto,
      adminUserId: adminUser?.id,
    });

    return {
      success: true,
      message: "Manual email sent successfully",
      data: result,
    };
  }
}
