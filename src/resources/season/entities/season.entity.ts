import { Entity, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";

@Entity()
export class Season extends AbstractBaseEntity {
  @ApiProperty({
    description: "The name of the season",
    example: "Summer 2025",
  })
  @Column()
  name: string;

  @ApiProperty({
    description: "Start date of the season",
    example: "2025-06-01T00:00:00Z",
  })
  @Column({ type: "timestamp" })
  startDate: Date;

  @ApiProperty({
    description: "End date of the season",
    example: "2025-08-31T00:00:00Z",
  })
  @Column({ type: "timestamp" })
  endDate: Date;

  @ApiProperty({
    description: "Description of the season",
    example: "Hot summer deals and seasonal perks",
    required: false,
  })
  @Column({ type: "text", nullable: true })
  description: string;

  @ApiProperty({
    description: "Text color for the season UI elements",
    example: "#FFFFFF",
    required: false,
  })
  @Column({ nullable: true })
  textColor: string;

  @ApiProperty({
    description: "Background color for the season UI elements",
    example: "#FF5733",
    required: false,
  })
  @Column({ nullable: true })
  bgColor: string;

  @ApiProperty({
    description: "Border color for the season UI elements",
    example: "#C70039",
    required: false,
  })
  @Column({ nullable: true })
  borderColor: string;
}
