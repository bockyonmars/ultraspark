import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller({ path: 'services', version: '1' })
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active services' })
  async findAll() {
    const services = await this.servicesService.findActiveServices();

    return {
      success: true,
      message: 'Services retrieved',
      data: services,
    };
  }
}
