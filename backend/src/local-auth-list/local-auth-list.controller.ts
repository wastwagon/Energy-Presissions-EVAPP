import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocalAuthListService } from './local-auth-list.service';

@ApiTags('Local Auth List')
@Controller('local-auth-list')
export class LocalAuthListController {
  constructor(private readonly localAuthListService: LocalAuthListService) {}

  @Get('version/:chargePointId')
  @ApiOperation({ summary: 'Get local list version for charge point' })
  @ApiResponse({ status: 200, description: 'Local list version' })
  async getLocalListVersion(@Param('chargePointId') chargePointId: string) {
    return this.localAuthListService.getLocalListVersion(chargePointId);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send local authorization list to charge point' })
  @ApiResponse({ status: 200, description: 'Local list sent' })
  async sendLocalList(
    @Body()
    body: {
      chargePointId: string;
      listVersion: number;
      updateType: 'Full' | 'Differential';
      localAuthorizationList: Array<{
        idTag: string;
        idTagInfo: {
          status: string;
          expiryDate?: string;
          parentIdTag?: string;
        };
      }>;
    },
  ) {
    return this.localAuthListService.sendLocalList(body);
  }

  @Get(':chargePointId')
  @ApiOperation({ summary: 'Get local auth list for charge point' })
  @ApiResponse({ status: 200, description: 'Local auth list' })
  async getLocalAuthList(@Param('chargePointId') chargePointId: string) {
    return this.localAuthListService.getLocalAuthList(chargePointId);
  }

  @Get(':chargePointId/:idTag')
  @ApiOperation({ summary: 'Get local auth list entry' })
  @ApiResponse({ status: 200, description: 'Local auth list entry' })
  async getLocalAuthListEntry(
    @Param('chargePointId') chargePointId: string,
    @Param('idTag') idTag: string,
  ) {
    return this.localAuthListService.getLocalAuthListEntry(chargePointId, idTag);
  }
}



