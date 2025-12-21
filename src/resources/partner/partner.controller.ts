import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { PartnerService } from "./partner.service";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Partners")
@Controller("partners")
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new partner" })
  async register(@Body() createPartnerDto: CreatePartnerDto) {
    if (createPartnerDto.password !== createPartnerDto.confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }
    const { confirmPassword, ...partnerData } = createPartnerDto;
    return this.partnerService.create(partnerData as any);
  }
}
