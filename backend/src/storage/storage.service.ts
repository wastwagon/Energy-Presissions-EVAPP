import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: Client | null = null;

  constructor(private readonly config: ConfigService) {}

  private getBucket(): string {
    return this.config.get<string>('MINIO_BUCKET') || 'ev-billing';
  }

  private getClient(): Client {
    if (this.client) {
      return this.client;
    }
    const endPoint = this.config.get<string>('MINIO_ENDPOINT');
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY');
    if (!endPoint || !accessKey || !secretKey) {
      throw new ServiceUnavailableException(
        'Object storage is not configured (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY).',
      );
    }
    const port = parseInt(this.config.get<string>('MINIO_PORT') || '9000', 10);
    const useSSL = this.config.get<string>('MINIO_USE_SSL') === 'true';
    this.client = new Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
    return this.client;
  }

  async ensureBucket(): Promise<void> {
    const client = this.getClient();
    const bucket = this.getBucket();
    const exists = await client.bucketExists(bucket);
    if (!exists) {
      await client.makeBucket(bucket, '');
      this.logger.log(`Created bucket ${bucket}`);
    }
  }

  private safeFileBase(originalName: string): string {
    return (originalName || 'upload').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
  }

  private async putPublicObject(
    objectName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    await this.ensureBucket();
    const client = this.getClient();
    const bucket = this.getBucket();
    await client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': mimeType || 'application/octet-stream',
    });
    return this.publicUrlForObject(objectName);
  }

  /**
   * Upload a branding file; returns a browser-loadable URL stored in branding_assets.file_path.
   */
  async uploadBrandingObject(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<string> {
    const objectName = `branding/${randomUUID()}-${this.safeFileBase(originalName)}`;
    return this.putPublicObject(objectName, buffer, mimeType);
  }

  /** Vendor logo under vendors/{id}/… — stored in vendors.logo_url */
  async uploadVendorLogo(
    vendorId: number,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<string> {
    const objectName = `vendors/${vendorId}/${randomUUID()}-${this.safeFileBase(originalName)}`;
    return this.putPublicObject(objectName, buffer, mimeType);
  }

  publicUrlForObject(objectName: string): string {
    const explicit = this.config.get<string>('MINIO_PUBLIC_BASE_URL')?.replace(/\/$/, '');
    if (explicit) {
      return `${explicit}/${objectName}`;
    }
    const bucket = this.getBucket();
    const endPoint = this.config.get<string>('MINIO_ENDPOINT');
    const useSSL = this.config.get<string>('MINIO_USE_SSL') === 'true';
    const port = parseInt(this.config.get<string>('MINIO_PORT') || '9000', 10);
    const protocol = useSSL ? 'https' : 'http';
    const portPart =
      (!useSSL && port !== 80) || (useSSL && port !== 443) ? `:${port}` : '';
    return `${protocol}://${endPoint}${portPart}/${bucket}/${objectName}`;
  }

  /**
   * Best-effort: derive object key from stored file_path for deletes.
   */
  parseObjectKeyFromStoredPath(filePath: string): string | null {
    if (!filePath || filePath.startsWith('/uploads/')) {
      return null;
    }
    const explicit = this.config.get<string>('MINIO_PUBLIC_BASE_URL')?.replace(/\/$/, '');
    if (explicit && filePath.startsWith(explicit)) {
      return filePath.slice(explicit.length + 1);
    }
    const bucket = this.getBucket();
    const idx = filePath.indexOf(`/${bucket}/`);
    if (idx === -1) {
      return null;
    }
    return filePath.slice(idx + bucket.length + 2);
  }

  async removeObjectIfKey(objectKey: string): Promise<void> {
    const client = this.getClient();
    const bucket = this.getBucket();
    await client.removeObject(bucket, objectKey);
  }
}
