import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview' })
  async overview() {
    const overview = await this.analyticsService.overview();

    return {
      success: true,
      message: 'Analytics overview retrieved',
      data: overview,
    };
  }

  @Get('marketing/summary')
  @ApiOperation({ summary: 'Get marketing analytics summary' })
  async marketingSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const summary = await this.analyticsService.marketingSummary({ startDate, endDate });

    return {
      success: true,
      message: summary.configured
        ? 'Marketing analytics loaded'
        : 'Google Analytics and Ads are not connected yet.',
      data: summary,
    };
  }

  @Get('marketing/traffic')
  @ApiOperation({ summary: 'Get marketing traffic analytics' })
  async marketingTraffic(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const traffic = await this.analyticsService.marketingTraffic({ startDate, endDate });

    return {
      success: true,
      message: 'Marketing traffic analytics loaded',
      data: traffic,
    };
  }

  @Get('marketing/sources')
  @ApiOperation({ summary: 'Get marketing source analytics' })
  async marketingSources(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const sources = await this.analyticsService.marketingSources({ startDate, endDate });

    return {
      success: true,
      message: 'Marketing source analytics loaded',
      data: sources,
    };
  }

  @Get('marketing/ads')
  @ApiOperation({ summary: 'Get Google Ads analytics' })
  async marketingAds() {
    const ads = await this.analyticsService.marketingAds();

    return {
      success: true,
      message: ads.configured
        ? 'Google Ads analytics loaded'
        : 'Google Ads is not connected yet.',
      data: ads,
    };
  }

  @Get('marketing/conversions')
  @ApiOperation({ summary: 'Get marketing conversion analytics' })
  async marketingConversions(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const conversions = await this.analyticsService.marketingConversions({ startDate, endDate });

    return {
      success: true,
      message: 'Marketing conversion analytics loaded',
      data: conversions,
    };
  }
}
