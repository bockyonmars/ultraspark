import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import type { Response } from 'express';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { UploadedFile as StoredUploadFile } from '../storage/storage.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { SendInvoiceEmailDto } from './dto/send-invoice-email.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('Admin Invoices')
@Controller({ path: 'admin/invoices', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create invoice record' })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const invoice = await this.invoicesService.create(
      createInvoiceDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Invoice created',
      data: invoice,
    };
  }

  @Post('from-quote/:quoteId')
  @ApiOperation({ summary: 'Create invoice from quote document' })
  async createFromQuote(
    @Param('quoteId') quoteId: string,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const invoice = await this.invoicesService.createFromQuote(
      quoteId,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Invoice created from quote',
      data: invoice,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  async findAll(
    @Query('status') status?: InvoiceStatus,
    @Query('customerId') customerId?: string,
    @Query('bookingId') bookingId?: string,
    @Query('quoteId') quoteId?: string,
    @Query('q') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const invoices = await this.invoicesService.findAll({
      status: this.parseStatus(status),
      customerId,
      bookingId,
      quoteId,
      search,
      from,
      to,
    });

    return {
      success: true,
      message: 'Invoices retrieved',
      data: invoices,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice detail' })
  async findOne(@Param('id') id: string) {
    const invoice = await this.invoicesService.findOne(id);

    return {
      success: true,
      message: 'Invoice retrieved',
      data: invoice,
    };
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download invoice PDF' })
  async downloadPdf(@Param('id') id: string, @Res() response: Response) {
    const pdf = await this.invoicesService.readPdf(id);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${pdf.fileName.replace(/"/g, '')}"`,
    );
    response.setHeader('Content-Length', String(pdf.fileSize));
    response.send(pdf.file);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice record' })
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const invoice = await this.invoicesService.update(
      id,
      updateInvoiceDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Invoice updated',
      data: invoice,
    };
  }

  @Post(':id/upload-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload invoice PDF' })
  async uploadPdf(
    @Param('id') id: string,
    @UploadedFile() file: StoredUploadFile,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const invoice = await this.invoicesService.uploadPdf(
      id,
      file,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Invoice PDF uploaded',
      data: invoice,
    };
  }

  @Post(':id/send-email')
  @ApiOperation({ summary: 'Send invoice email' })
  async sendEmail(
    @Param('id') id: string,
    @Body() sendInvoiceEmailDto: SendInvoiceEmailDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const result = await this.invoicesService.sendEmail(
      id,
      sendInvoiceEmailDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Invoice email sent',
      data: result,
    };
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  async markPaid(
    @Param('id') id: string,
    @Body() markInvoicePaidDto: MarkInvoicePaidDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const invoice = await this.invoicesService.markPaid(
      id,
      markInvoicePaidDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Invoice marked as paid',
      data: invoice,
    };
  }

  private parseStatus(status?: InvoiceStatus) {
    if (!status) {
      return undefined;
    }

    return Object.values(InvoiceStatus).includes(status) ? status : undefined;
  }
}
