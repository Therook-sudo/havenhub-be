import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { PropertiesModule } from './properties/properties.module';
import {
  User,
  Property,
  Enquiry,
  SavedProperty,
  Report,
  AuditLog,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.url'),
        entities: [User, Property, Enquiry, SavedProperty, Report, AuditLog],
        synchronize: configService.get<string>('nodeEnv') === 'development',
        logging: configService.get<string>('nodeEnv') === 'development',
      }),
    }),
    HealthModule,
    PropertiesModule,
  ],
})
export class AppModule {}

