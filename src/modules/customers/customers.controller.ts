import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers' })
  async findAll() {
    const customers = await this.customersService.findAll();

    return {
      success: true,
      message: 'Customers retrieved',
      data: customers,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details' })
  async findOne(@Param('id') id: string) {
    const customer = await this.customersService.findOne(id);

    return {
      success: true,
      message: 'Customer retrieved',
      data: customer,
    };
  }
}
