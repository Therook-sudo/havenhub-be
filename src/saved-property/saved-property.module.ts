import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedProperty } from '@/entities';
import { SavedPropertyService } from './saved-property.service';
import { SavedPropertyController } from './saved-property.controller';
import {Property} from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SavedProperty,
      Property,
    ]),
  ],
  controllers: [SavedPropertyController],
  providers: [SavedPropertyService],
})
export class SavedPropertyModule {}
