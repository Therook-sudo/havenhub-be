import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
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
        url: configService.get<string>('database.url') || configService.get<string>('DATABASE_URL'),
        entities: [User, Property, Enquiry, SavedProperty, Report, AuditLog],
        synchronize: configService.get<string>('nodeEnv') === 'development',
        logging: configService.get<string>('nodeEnv') === 'development',
      }),
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
    PropertiesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
