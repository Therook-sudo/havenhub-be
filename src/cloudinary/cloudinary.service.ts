import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    const cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET;
    const cloudinaryUrl =
      this.configService.get<string>('CLOUDINARY_URL') ||
      process.env.CLOUDINARY_URL;

    if (cloudinaryUrl && cloudinaryUrl.trim().length > 0) {
      cloudinary.config({ url: cloudinaryUrl.trim() });
      this.isConfigured = true;
      this.logger.log('Cloudinary initialized via CLOUDINARY_URL.');
    } else if (
      cloudName &&
      apiKey &&
      apiSecret &&
      !cloudName.includes('your_') &&
      !apiKey.includes('your_')
    ) {
      cloudinary.config({
        cloud_name: cloudName.trim(),
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
      });
      this.isConfigured = true;
      this.logger.log(`Cloudinary initialized for cloud: ${cloudName.trim()}`);
    } else {
      this.logger.warn(
        'Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing or set to defaults in environment variables.',
      );
    }
  }

  async uploadImage(file: UploadFile, folder = 'havenhub/avatars'): Promise<string> {
    if (!file || !file.buffer) {
      throw new InternalServerErrorException('Invalid file buffer for upload');
    }

    if (!this.isConfigured) {
      this.logger.warn('Cloudinary is not configured in env. Returning fallback placeholder.');
      throw new Error('Cloudinary credentials not configured');
    }

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              this.logger.error(`Cloudinary upload stream error: ${error.message}`);
              reject(error);
              return;
            }
            if (!result) {
              reject(
                new InternalServerErrorException('Cloudinary upload returned empty response'),
              );
              return;
            }
            resolve(result);
          },
        );

        uploadStream.end(file.buffer);
      });

      return result.secure_url;
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async uploadImages(buffers: Buffer[], folder = 'havenhub/properties'): Promise<string[]> {
    const uploadPromises = buffers.map((buffer) =>
      this.uploadImage({ buffer, mimetype: '', originalname: '' }, folder),
    );
    return Promise.all(uploadPromises);
  }
}
