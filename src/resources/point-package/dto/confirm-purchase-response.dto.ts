import { ApiProperty } from "@nestjs/swagger";
import { BusinessPointPackage } from "../entities/business-point-package.entity";

export class ConfirmPurchaseResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: () => BusinessPointPackage })
  package: BusinessPointPackage;
}
