import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import configuration from "./config/configuration";
import { HealthModule } from "./health/health.module";
import {
  User,
  Property,
  Enquiry,
  SavedProperty,
  Report,
  AuditLog,
} from "./entities";
import { UsersModule } from "./users/users.module";
import { JwtModule } from "@nestjs/jwt";

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
        type: "postgres",
        url: configService.get<string>("database.url"),
        entities: [User, Property, Enquiry, SavedProperty, Report, AuditLog],
        synchronize: configService.get<string>("nodeEnv") === "development",
        logging: configService.get<string>("nodeEnv") === "development",
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        registerOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN"),
        },
      }),
    }),
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
