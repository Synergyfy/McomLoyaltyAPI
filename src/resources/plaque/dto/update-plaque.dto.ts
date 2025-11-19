import { PartialType } from '@nestjs/swagger';
import { CreatePlaqueDto } from './create-plaque.dto';

export class UpdatePlaqueDto extends PartialType(CreatePlaqueDto) {}
