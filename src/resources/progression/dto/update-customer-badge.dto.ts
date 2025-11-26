import { PartialType } from '@nestjs/swagger';
import { CreateCustomerBadgeDto } from './create-customer-badge.dto';

export class UpdateCustomerBadgeDto extends PartialType(CreateCustomerBadgeDto) {}
