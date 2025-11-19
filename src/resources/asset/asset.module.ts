import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssetService } from './asset.service';

@Module({
  imports: [ConfigModule],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
