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
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageStatusDto } from './dto/update-contact-message-status.dto';
import { ContactMessagesService } from './contact-messages.service';

@ApiTags('Contact Messages')
@Controller({ version: '1' })
export class ContactMessagesController {
  constructor(private readonly contactMessagesService: ContactMessagesService) {}

  @Public()
  @Post('contact')
  @ApiOperation({ summary: 'Submit public contact form' })
  async create(@Body() createDto: CreateContactMessageDto) {
    const contactMessage = await this.contactMessagesService.create(createDto);

    return {
      success: true,
      message: 'Contact message submitted successfully',
      data: contactMessage,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('contact-messages')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contact messages' })
  async findAll() {
    const contactMessages = await this.contactMessagesService.findAll();

    return {
      success: true,
      message: 'Contact messages retrieved',
      data: contactMessages,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('contact-messages/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contact message status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateContactMessageStatusDto,
    @CurrentAdmin() adminUser: { id: string },
  ) {
    const contactMessage = await this.contactMessagesService.updateStatus(
      id,
      updateDto,
      adminUser?.id,
    );

    return {
      success: true,
      message: 'Contact message status updated',
      data: contactMessage,
    };
  }
}
