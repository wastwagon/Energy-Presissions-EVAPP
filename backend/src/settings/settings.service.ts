import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting, SettingCategory } from '../entities/system-setting.entity';
import { CmsContent, ContentType } from '../entities/cms-content.entity';
import { BrandingAsset, AssetType } from '../entities/branding-asset.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(CmsContent)
    private cmsContentRepository: Repository<CmsContent>,
    @InjectRepository(BrandingAsset)
    private brandingAssetRepository: Repository<BrandingAsset>,
  ) {}

  // System Settings Methods
  async getAllSettings(category?: SettingCategory): Promise<SystemSetting[]> {
    const where = category ? { category } : {};
    return this.systemSettingRepository.find({
      where,
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  async getSetting(key: string): Promise<SystemSetting> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  async getSettingValue(key: string, defaultValue?: any): Promise<any> {
    try {
      const setting = await this.getSetting(key);
      return this.parseValue(setting.value, setting.dataType);
    } catch (error) {
      return defaultValue;
    }
  }

  async updateSetting(key: string, value: any): Promise<SystemSetting> {
    const setting = await this.getSetting(key);
    
    // Validate value based on data type
    const parsedValue = this.parseValue(value, setting.dataType);
    setting.value = this.stringifyValue(parsedValue, setting.dataType);
    
    return this.systemSettingRepository.save(setting);
  }

  async createSetting(
    key: string,
    value: any,
    category: SettingCategory,
    description?: string,
    dataType: 'string' | 'number' | 'boolean' | 'json' = 'string',
    isPublic: boolean = false,
  ): Promise<SystemSetting> {
    const existing = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (existing) {
      throw new BadRequestException(`Setting with key "${key}" already exists`);
    }

    const setting = this.systemSettingRepository.create({
      key,
      value: this.stringifyValue(value, dataType),
      category,
      description,
      dataType,
      isPublic,
    });

    return this.systemSettingRepository.save(setting);
  }

  async getPublicSettings(): Promise<Record<string, any>> {
    const settings = await this.systemSettingRepository.find({
      where: { isPublic: true },
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = this.parseValue(setting.value, setting.dataType);
    }

    return result;
  }

  // CMS Content Methods
  async getAllContent(tenantId?: number, section?: string): Promise<CmsContent[]> {
    const where: any = {};
    if (tenantId !== undefined) {
      where.tenantId = tenantId;
    }
    if (section) {
      where.section = section;
    }

    return this.cmsContentRepository.find({
      where,
      order: { section: 'ASC', key: 'ASC' },
    });
  }

  async getContent(key: string, tenantId?: number): Promise<CmsContent> {
    const where: any = { key };
    if (tenantId !== undefined) {
      where.tenantId = tenantId;
    }

    const content = await this.cmsContentRepository.findOne({ where });

    if (!content) {
      throw new NotFoundException(`Content with key "${key}" not found`);
    }

    return content;
  }

  async createOrUpdateContent(
    key: string,
    title: string,
    content: string,
    contentType: ContentType,
    section?: string,
    tenantId?: number,
    metadata?: Record<string, any>,
  ): Promise<CmsContent> {
    const existing = await this.cmsContentRepository.findOne({
      where: { key, tenantId: tenantId || null },
    });

    if (existing) {
      existing.title = title;
      existing.content = content;
      existing.contentType = contentType;
      existing.section = section;
      existing.metadata = metadata;
      return this.cmsContentRepository.save(existing);
    }

    const cmsContent = this.cmsContentRepository.create({
      key,
      title,
      content,
      contentType,
      section,
      tenantId,
      metadata,
    });

    return this.cmsContentRepository.save(cmsContent);
  }

  async deleteContent(key: string, tenantId?: number): Promise<void> {
    const where: any = { key };
    if (tenantId !== undefined) {
      where.tenantId = tenantId;
    }

    const result = await this.cmsContentRepository.delete(where);
    if (result.affected === 0) {
      throw new NotFoundException(`Content with key "${key}" not found`);
    }
  }

  // Branding Assets Methods
  async getAllAssets(tenantId?: number, assetType?: AssetType): Promise<BrandingAsset[]> {
    const where: any = {};
    if (tenantId !== undefined) {
      where.tenantId = tenantId;
    }
    if (assetType) {
      where.assetType = assetType;
    }

    return this.brandingAssetRepository.find({
      where,
      order: { assetType: 'ASC', createdAt: 'DESC' },
    });
  }

  async getActiveAsset(assetType: AssetType, tenantId?: number): Promise<BrandingAsset | null> {
    const where: any = {
      assetType,
      isActive: true,
    };
    if (tenantId !== undefined) {
      where.tenantId = tenantId;
    }

    return this.brandingAssetRepository.findOne({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async createAsset(
    assetType: AssetType,
    filePath: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    width?: number,
    height?: number,
    tenantId?: number,
  ): Promise<BrandingAsset> {
    // Deactivate other assets of the same type
    const where: any = { assetType, isActive: true };
    if (tenantId !== undefined) {
      where.tenantId = tenantId;
    }

    await this.brandingAssetRepository.update(where, { isActive: false });

    const asset = this.brandingAssetRepository.create({
      assetType,
      filePath,
      fileName,
      fileSize,
      mimeType,
      width,
      height,
      tenantId,
      isActive: true,
    });

    return this.brandingAssetRepository.save(asset);
  }

  async deleteAsset(id: number): Promise<void> {
    const result = await this.brandingAssetRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
  }

  // Helper methods
  private parseValue(value: string, dataType: 'string' | 'number' | 'boolean' | 'json'): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (dataType) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  private stringifyValue(value: any, dataType: 'string' | 'number' | 'boolean' | 'json'): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (dataType) {
      case 'json':
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }
}



