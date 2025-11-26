import { PartialType } from '@nestjs/swagger';
import { CreateBusinessLevelDto } from './create-business-level.dto';

export class UpdateBusinessLevelDto extends PartialType(CreateBusinessLevelDto) {}
