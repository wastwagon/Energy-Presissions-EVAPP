import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SystemSetting, SettingCategory } from '../entities/system-setting.entity';
import { CmsContent, ContentType } from '../entities/cms-content.entity';
import { BrandingAsset, AssetType } from '../entities/branding-asset.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StorageService } from '../storage/storage.service';

@ApiTags('Settings')
@Controller('admin/settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly storageService: StorageService,
  ) {}

  // System Settings Endpoints
  @Get('system')
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'List of system settings', type: [SystemSetting] })
  async getAllSettings(@Query('category') category?: SettingCategory): Promise<SystemSetting[]> {
    return this.settingsService.getAllSettings(category);
  }

  @Get('system/public')
  @ApiOperation({ summary: 'Get public system settings (for frontend)' })
  @ApiResponse({ status: 200, description: 'Public settings object' })
  async getPublicSettings(): Promise<Record<string, any>> {
    return this.settingsService.getPublicSettings();
  }

  @Get('system/:key')
  @ApiOperation({ summary: 'Get a specific system setting' })
  @ApiResponse({ status: 200, description: 'System setting', type: SystemSetting })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async getSetting(@Param('key') key: string): Promise<SystemSetting> {
    return this.settingsService.getSetting(key);
  }

  @Put('system/:key')
  @ApiOperation({ summary: 'Update a system setting' })
  @ApiResponse({ status: 200, description: 'Setting updated', type: SystemSetting })
  async updateSetting(
    @Param('key') key: string,
    @Body() body: { value: any },
  ): Promise<SystemSetting> {
    return this.settingsService.updateSetting(key, body.value);
  }

  @Post('system')
  @ApiOperation({ summary: 'Create a new system setting' })
  @ApiResponse({ status: 201, description: 'Setting created', type: SystemSetting })
  async createSetting(
    @Body()
    body: {
      key: string;
      value: any;
      category: SettingCategory;
      description?: string;
      dataType?: 'string' | 'number' | 'boolean' | 'json';
      isPublic?: boolean;
    },
  ): Promise<SystemSetting> {
    return this.settingsService.createSetting(
      body.key,
      body.value,
      body.category,
      body.description,
      body.dataType,
      body.isPublic,
    );
  }

  // CMS Content Endpoints
  @Get('cms')
  @ApiOperation({ summary: 'Get all CMS content' })
  @ApiResponse({ status: 200, description: 'List of CMS content', type: [CmsContent] })
  async getAllContent(
    @Query('vendorId') vendorId?: number,
    @Query('section') section?: string,
  ): Promise<CmsContent[]> {
    return this.settingsService.getAllContent(
      vendorId ? parseInt(vendorId.toString()) : undefined,
      section,
    );
  }

  @Get('cms/:key')
  @ApiOperation({ summary: 'Get CMS content by key' })
  @ApiResponse({ status: 200, description: 'CMS content', type: CmsContent })
  async getContent(
    @Param('key') key: string,
    @Query('vendorId') vendorId?: number,
  ): Promise<CmsContent> {
    return this.settingsService.getContent(key, vendorId ? parseInt(vendorId.toString()) : undefined);
  }

  @Post('cms')
  @ApiOperation({ summary: 'Create or update CMS content' })
  @ApiResponse({ status: 201, description: 'Content created/updated', type: CmsContent })
  async createOrUpdateContent(
    @Body()
    body: {
      key: string;
      title: string;
      content: string;
      contentType: ContentType;
      section?: string;
      vendorId?: number;
      metadata?: Record<string, any>;
    },
  ): Promise<CmsContent> {
    return this.settingsService.createOrUpdateContent(
      body.key,
      body.title,
      body.content,
      body.contentType,
      body.section,
      body.vendorId,
      body.metadata,
    );
  }

  @Delete('cms/:key')
  @ApiOperation({ summary: 'Delete CMS content' })
  @ApiResponse({ status: 204, description: 'Content deleted' })
  async deleteContent(
    @Param('key') key: string,
    @Query('vendorId') vendorId?: number,
  ): Promise<void> {
    return this.settingsService.deleteContent(key, vendorId ? parseInt(vendorId.toString()) : undefined);
  }

  // Branding Assets Endpoints
  @Get('branding')
  @ApiOperation({ summary: 'Get all branding assets' })
  @ApiResponse({ status: 200, description: 'List of branding assets', type: [BrandingAsset] })
  async getAllAssets(
    @Query('vendorId') vendorId?: number,
    @Query('assetType') assetType?: AssetType,
  ): Promise<BrandingAsset[]> {
    return this.settingsService.getAllAssets(
      vendorId ? parseInt(vendorId.toString()) : undefined,
      assetType,
    );
  }

  @Get('branding/active/:assetType')
  @ApiOperation({ summary: 'Get active branding asset by type' })
  @ApiResponse({ status: 200, description: 'Active branding asset', type: BrandingAsset })
  async getActiveAsset(
    @Param('assetType') assetType: AssetType,
    @Query('vendorId') vendorId?: number,
  ): Promise<BrandingAsset | null> {
    return this.settingsService.getActiveAsset(
      assetType,
      vendorId ? parseInt(vendorId.toString()) : undefined,
    );
  }

  @Post('branding/upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  @ApiOperation({ summary: 'Upload a branding asset' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        assetType: { type: 'string', enum: ['logo', 'favicon', 'banner', 'background', 'icon'] },
        vendorId: { type: 'number' },
      },
      required: ['file', 'assetType'] as string[],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'Asset uploaded', type: BrandingAsset })
  async uploadAsset(
    @UploadedFile() file: { buffer?: Buffer; path?: string; originalname: string; size: number; mimetype: string },
    @Body() body: { assetType: AssetType; vendorId?: number },
  ): Promise<BrandingAsset> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const buffer = file.buffer
      ? file.buffer
      : file.path
        ? await readFile(file.path)
        : null;
    if (!buffer) {
      throw new BadRequestException('Could not read uploaded file');
    }
    const filePath = await this.storageService.uploadBrandingObject(
      buffer,
      file.originalname,
      file.mimetype,
    );

    return this.settingsService.createAsset(
      body.assetType,
      filePath,
      file.originalname,
      file.size,
      file.mimetype,
      undefined, // width
      undefined, // height
      body.vendorId ? parseInt(body.vendorId.toString()) : undefined,
    );
  }

  @Delete('branding/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  @ApiOperation({ summary: 'Delete a branding asset' })
  @ApiResponse({ status: 204, description: 'Asset deleted' })
  async deleteAsset(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.settingsService.deleteAsset(id);
  }
}

