import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import {ConfigService} from '@nestjs/config';

interface UploadFile{
    buffer: Buffer;
    mimetype: string;
    originalname: string;
}


@Injectable()
export class CloudinaryService {
    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>(
                'CLOUDINARY_CLOUD_NAME',
            ),
            api_key: this.configService.get<string>(
                'CLOUDINARY_API_KEY',
            ),
            api_secret: this.configService.get<string>(
                'CLOUDINARY_API_SECRET',
            ),
        });
    }

    async uploadImage(
        file:UploadFile
    ): Promise<string> {
        try {
            const result = await new Promise<UploadApiResponse>(
                (resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'havenhub/properties',
                            resource_type: 'image',
                        },
                        (error, result) => {
                            if (error) {
                                // console.error('Cloudinary upload error:', error);
                                reject(error);
                                return;
                            } 
                            if (!result) {
                                reject(
                                    new InternalServerErrorException(
                                        error || 'Cloudinary upload failed',
                                    ),
                                );
                                return;
                            }
                            resolve(result);
                        },
                    );

                    uploadStream.end(file.buffer);
                },
            );
            return result.secure_url;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error uploading image to Cloudinary',
            );
        }
    }

    async uploadImages(
        buffers: Buffer[],
    ): Promise<string[]> {
        const uploadPromises = buffers.map((buffer) => this.uploadImage({ buffer, mimetype: '', originalname: '' }));
        return Promise.all(uploadPromises);
    }
}
