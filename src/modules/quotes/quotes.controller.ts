import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuoteStatus } from '@prisma/client';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuotesService } from './quotes.service';

@ApiTags('Admin Quote Documents')
@Controller({ path: 'admin/quotes', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('next-number')
  @ApiOperation({ summary: 'Generate the next quote number' })
  async nextQuoteNumber() {
    const quoteNumber = await this.quotesService.nextQuoteNumber();

    return {
      success: true,
      message: 'Quote number generated',
      data: { quoteNumber },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List quote and estimate documents' })
  async findAll(
    @Query('status') status?: QuoteStatus,
    @Query('q') search?: string,
  ) {
    const quotes = await this.quotesService.findAll({
      status: this.parseStatus(status),
      search,
    });

    return {
      success: true,
      message: 'Quote documents retrieved',
      data: quotes,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a quote or estimate document' })
  async create(
    @Body() createQuoteDto: CreateQuoteDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const quote = await this.quotesService.create(
      createQuoteDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Quote document saved',
      data: quote,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote or estimate document details' })
  async findOne(@Param('id') id: string) {
    const quote = await this.quotesService.findOne(id);

    return {
      success: true,
      message: 'Quote document retrieved',
      data: quote,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quote or estimate document' })
  async update(
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const quote = await this.quotesService.update(
      id,
      updateQuoteDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Quote document updated',
      data: quote,
    };
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send a quote or estimate document to the customer' })
  async send(
    @Param('id') id: string,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const quote = await this.quotesService.send(id, adminUser?.id);

    return {
      success: true,
      message: 'Quote document sent',
      data: quote,
    };
  }

  private parseStatus(status?: QuoteStatus) {
    if (!status) {
      return undefined;
    }

    return Object.values(QuoteStatus).includes(status) ? status : undefined;
  }
}
