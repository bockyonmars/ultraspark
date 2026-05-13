import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentAdmin } from "../../common/decorators/current-admin.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AssignSupportTicketDto } from "./dto/assign-support-ticket.dto";
import { CreateAdminSupportTicketDto } from "./dto/create-admin-support-ticket.dto";
import { CreateSupportTicketMessageDto } from "./dto/create-support-ticket-message.dto";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketStatusDto } from "./dto/update-support-ticket-status.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import { SupportTicketsService } from "./support-tickets.service";

@ApiTags("Support Tickets")
@Controller({ version: "1" })
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("support/tickets")
  @ApiOperation({ summary: "Create public support ticket" })
  async createPublic(@Body() createDto: CreateSupportTicketDto) {
    const ticket = await this.supportTicketsService.createPublic(createDto);

    return {
      success: true,
      message: "Support ticket submitted successfully",
      data: ticket,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("support/tickets/admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create admin support ticket" })
  async createAdmin(
    @Body() createDto: CreateAdminSupportTicketDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const ticket = await this.supportTicketsService.createAdmin(
      createDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: "Support ticket created",
      data: ticket,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("support/tickets")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List support tickets" })
  async findAll(@Query("q") query?: string) {
    const tickets = await this.supportTicketsService.findAll({ query });

    return {
      success: true,
      message: "Support tickets retrieved",
      data: tickets,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("support/tickets/:id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get support ticket details" })
  async findOne(@Param("id") id: string) {
    const ticket = await this.supportTicketsService.findOne(id);

    return {
      success: true,
      message: "Support ticket retrieved",
      data: ticket,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("support/tickets/:id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update support ticket" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateSupportTicketDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const ticket = await this.supportTicketsService.update(
      id,
      updateDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: "Support ticket updated",
      data: ticket,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("support/tickets/:id/status")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update support ticket status" })
  async updateStatus(
    @Param("id") id: string,
    @Body() updateDto: UpdateSupportTicketStatusDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const ticket = await this.supportTicketsService.updateStatus(
      id,
      updateDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: "Support ticket status updated",
      data: ticket,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("support/tickets/:id/assign")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Assign support ticket" })
  async assign(
    @Param("id") id: string,
    @Body() assignDto: AssignSupportTicketDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const ticket = await this.supportTicketsService.assign(
      id,
      assignDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: "Support ticket assignment updated",
      data: ticket,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("support/tickets/:id/messages")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create support ticket message" })
  async createMessage(
    @Param("id") id: string,
    @Body() createDto: CreateSupportTicketMessageDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const message = await this.supportTicketsService.createMessage(
      id,
      createDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: "Support ticket message created",
      data: message,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("support/tickets/:id/messages")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List support ticket messages" })
  async findMessages(@Param("id") id: string) {
    const messages = await this.supportTicketsService.findMessages(id);

    return {
      success: true,
      message: "Support ticket messages retrieved",
      data: messages,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("support/tickets/:id/activity")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List support ticket activity" })
  async findActivity(@Param("id") id: string) {
    const activity = await this.supportTicketsService.findActivity(id);

    return {
      success: true,
      message: "Support ticket activity retrieved",
      data: activity,
    };
  }
}
