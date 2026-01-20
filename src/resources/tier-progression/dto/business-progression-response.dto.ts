import { ApiProperty } from "@nestjs/swagger";
import { ProgressionBenefits } from "../../tier/interfaces/tier-config.interface";

class ProgressionRequirement {
  @ApiProperty()
  name: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  current: string | number | boolean;

  @ApiProperty()
  target: string | number | boolean;

  @ApiProperty()
  remaining: string | number | boolean;

  @ApiProperty()
  isCompleted: boolean;
}

class NextLevelInfo {
  @ApiProperty()
  level: string;

  @ApiProperty()
  isCurrent: boolean;

  @ApiProperty({ type: [ProgressionRequirement] })
  requirements: ProgressionRequirement[];

  @ApiProperty()
  benefits: any; // We can use ProgressionBenefits if it's a class with ApiProperties, but it's an interface
}

export class BusinessProgressionResponseDto {
  @ApiProperty()
  tierName: string;

  @ApiProperty()
  currentLevel: string;

  @ApiProperty()
  metrics: any;

  @ApiProperty({ type: [NextLevelInfo] })
  nextLevels: NextLevelInfo[];
}
