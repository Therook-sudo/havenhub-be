import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { AiModule } from './ai/ai.module';
import { PropertiesModule } from './properties/properties.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import {
  User,
  Property,
  Enquiry,
  SavedProperty,
  Report,
  AuditLog,
} from './entities';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { SavedPropertyModule } from './saved-property/saved-property.module';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('database.url') || configService.get<string>('DATABASE_URL') || '';
        const isCloudDb = dbUrl.includes('render.com') || dbUrl.includes('railway') || dbUrl.includes('sslmode=require');
        
        return {
          type: 'postgres',
          url: dbUrl,
          entities: [User, Property, Enquiry, SavedProperty, Report, AuditLog],
          synchronize: configService.get<string>('nodeEnv') === 'development' || process.env.NODE_ENV === 'development',
          logging: configService.get<string>('nodeEnv') === 'development',
          ssl: isCloudDb ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'havenhub_dev_secret_key_2026',
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
    HealthModule,
    AiModule,
    PropertiesModule,
    UsersModule,
    AuthModule,
    EnquiriesModule,
    CloudinaryModule,
    SavedPropertyModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [CloudinaryService],
})
export class AppModule {}
