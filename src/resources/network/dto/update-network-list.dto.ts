import { PartialType } from '@nestjs/swagger';
import { CreateNetworkListDto } from './create-network-list.dto';

export class UpdateNetworkListDto extends PartialType(CreateNetworkListDto) {}
