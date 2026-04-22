import {
  Controller,
  Get,
  Query,
  Param,
  ParseFloatPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StationsService } from './stations.service';

@ApiTags('Stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get('nearby')
  // Allow public access for nearby stations (users need to find stations)
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Find nearby charging stations (Public)' })
  @ApiQuery({ name: 'latitude', type: Number, description: 'User latitude' })
  @ApiQuery({ name: 'longitude', type: Number, description: 'User longitude' })
  @ApiQuery({ name: 'radiusKm', type: Number, required: false, description: 'Search radius in kilometers (default: 50)' })
  @ApiQuery({ name: 'status', type: String, required: false, description: 'Comma-separated statuses (Available,Charging,Offline)' })
  @ApiQuery({ name: 'connectorType', type: String, required: false, description: 'Filter by connector type' })
  @ApiQuery({ name: 'minPowerKw', type: Number, required: false, description: 'Minimum power rating in kW' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Maximum number of results (default: 20)' })
  @ApiResponse({ status: 200, description: 'List of nearby stations with distance' })
  async findNearby(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radiusKm') radiusKm?: number,
    @Query('status') status?: string,
    @Query('connectorType') connectorType?: string,
    @Query('minPowerKw') minPowerKw?: number,
    @Query('limit') limit?: number,
  ) {
    const statusArray = status ? status.split(',') : undefined;
    return this.stationsService.findNearby({
      latitude,
      longitude,
      radiusKm: radiusKm ? parseFloat(radiusKm.toString()) : undefined,
      status: statusArray,
      connectorType,
      minPowerKw: minPowerKw ? parseFloat(minPowerKw.toString()) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
    });
  }

  @Get('map')
  // Allow public access for map view
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stations in map bounds (Public)' })
  @ApiQuery({ name: 'north', type: Number, description: 'North latitude bound' })
  @ApiQuery({ name: 'south', type: Number, description: 'South latitude bound' })
  @ApiQuery({ name: 'east', type: Number, description: 'East longitude bound' })
  @ApiQuery({ name: 'west', type: Number, description: 'West longitude bound' })
  @ApiQuery({ name: 'status', type: String, required: false })
  @ApiResponse({ status: 200, description: 'List of stations in map bounds' })
  async findInBounds(
    @Query('north', ParseFloatPipe) north: number,
    @Query('south', ParseFloatPipe) south: number,
    @Query('east', ParseFloatPipe) east: number,
    @Query('west', ParseFloatPipe) west: number,
    @Query('status') status?: string,
  ) {
    const statusArray = status ? status.split(',') : undefined;
    return this.stationsService.findInBounds(north, south, east, west, statusArray);
  }

  @Get('search')
  // Allow public access for search
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Search stations by location name, city, or region (Public)' })
  @ApiQuery({ name: 'q', type: String, description: 'Search query' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Maximum results (default: 50)' })
  @ApiQuery({
    name: 'latitude',
    type: Number,
    required: false,
    description: 'Optional user latitude to include distance (km) in results',
  })
  @ApiQuery({
    name: 'longitude',
    type: Number,
    required: false,
    description: 'Optional user longitude to include distance (km) in results',
  })
  @ApiResponse({ status: 200, description: 'List of matching stations with live connector counts' })
  async search(
    @Query('q') searchTerm: string,
    @Query('limit') limit?: number,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    const lat =
      latitude !== undefined && latitude !== '' ? parseFloat(latitude) : Number.NaN;
    const lng =
      longitude !== undefined && longitude !== '' ? parseFloat(longitude) : Number.NaN;
    const userLocation =
      !Number.isNaN(lat) && !Number.isNaN(lng) ? { latitude: lat, longitude: lng } : undefined;

    return this.stationsService.searchStations(
      searchTerm,
      limit ? parseInt(limit.toString(), 10) : undefined,
      userLocation,
    );
  }

  @Get('by-ids')
  @ApiOperation({ summary: 'Get stations by IDs (for favorites)' })
  @ApiQuery({ name: 'ids', type: String, description: 'Comma-separated charge point IDs' })
  @ApiResponse({ status: 200, description: 'List of stations' })
  async getByIds(@Query('ids') ids: string) {
    const chargePointIds = ids ? ids.split(',').map((s) => s.trim()).filter(Boolean) : [];
    return this.stationsService.getByIds(chargePointIds);
  }

  @Get(':id')
  // Public access for station details
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get station details (Public)' })
  @ApiResponse({ status: 200, description: 'Station details with connectors and active sessions' })
  async getStationDetails(@Param('id') chargePointId: string) {
    return this.stationsService.getStationDetails(chargePointId);
  }
}

