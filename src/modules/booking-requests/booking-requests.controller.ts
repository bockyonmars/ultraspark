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
import { UpdateBookingRequestStatusDto } from './dto/update-booking-request-status.dto';
import { BookingRequestsService } from './booking-requests.service';

@ApiTags('Booking Requests')
@Controller({ version: '1' })
export class BookingRequestsController {
  constructor(private readonly bookingRequestsService: BookingRequestsService) {}

  @Public()
  @Post('bookings')
  @ApiOperation({ summary: 'Submit public booking request' })
  async create(@Body() payload: Record<string, unknown>) {
    const bookingRequest = await this.bookingRequestsService.createPublic(payload);

    return {
      success: true,
      message: 'Booking request submitted successfully',
      data: bookingRequest,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List booking requests' })
  async findAll() {
    const bookingRequests = await this.bookingRequestsService.findAll();

    return {
      success: true,
      message: 'Booking requests retrieved',
      data: bookingRequests,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking request details' })
  async findOne(@Param('id') id: string) {
    const bookingRequest = await this.bookingRequestsService.findOne(id);

    return {
      success: true,
      message: 'Booking request retrieved',
      data: bookingRequest,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('bookings/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking request status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateBookingRequestStatusDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const bookingRequest = await this.bookingRequestsService.updateStatus(
      id,
      updateDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Booking request status updated',
      data: bookingRequest,
    };
  }
}
