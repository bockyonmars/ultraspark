import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { UpdateQuoteRequestStatusDto } from './dto/update-quote-request-status.dto';
import { QuoteRequestsService } from './quote-requests.service';

@ApiTags('Quote Requests')
@Controller({ version: '1' })
export class QuoteRequestsController {
  constructor(private readonly quoteRequestsService: QuoteRequestsService) {}

  @Public()
  @Post('quotes')
  @ApiOperation({ summary: 'Submit public quote request' })
  async create(@Body() createDto: CreateQuoteRequestDto) {
    const quoteRequest = await this.quoteRequestsService.create(createDto);

    return {
      success: true,
      message: 'Quote request submitted successfully',
      data: quoteRequest,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('quotes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List quote requests' })
  async findAll() {
    const quoteRequests = await this.quoteRequestsService.findAll();

    return {
      success: true,
      message: 'Quote requests retrieved',
      data: quoteRequests,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('quotes/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quote request details' })
  async findOne(@Param('id') id: string) {
    const quoteRequest = await this.quoteRequestsService.findOne(id);

    return {
      success: true,
      message: 'Quote request retrieved',
      data: quoteRequest,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('quotes/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quote request status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuoteRequestStatusDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const quoteRequest = await this.quoteRequestsService.updateStatus(
      id,
      updateDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Quote request status updated',
      data: quoteRequest,
    };
  }
}
