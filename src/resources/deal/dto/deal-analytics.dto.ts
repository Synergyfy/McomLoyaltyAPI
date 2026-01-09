import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsUUID, Min } from "class-validator";

export class DealAnalyticsDto {
  @ApiProperty()
  totalViews: number;
// ... (rest of class)
}

export class RecordTimeSpentDto {
    @ApiProperty()
    @IsUUID()
    analyticsId: string;
    
    @ApiProperty()
    @IsNumber()
    @Min(0)
    durationSeconds: number;
}
