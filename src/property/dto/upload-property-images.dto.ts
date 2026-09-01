import {IsArray, IsOptional, IsUrl} from 'class-validator';

export class UploadPropertyImagesDto {
    @IsArray()
    @IsOptional()
    @IsUrl({}, { each: true })
    fallbackUrls?: string[];
}