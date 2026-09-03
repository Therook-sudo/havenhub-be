import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from '../entities/Property.entity';
import { AuthModule } from '../auth/auth.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { Enquiry } from '../entities/Enquiry.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, Enquiry]),
    AuthModule,
    CloudinaryModule,
    AiModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
