import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ProvisionService } from "./provision.service";
import { CreateProvisionDto } from "./dto/create-provision.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
// Assuming there is a guard for internal S2S or Admin access. Using Public for now as S2S auth isn't detailed. 
// Ideally, this should be protected by a Secret Key Guard.
import { Public } from "../../common/decorators/public.decorator"; 

@ApiTags("Provision")
@Controller("provision")
export class ProvisionController {
  constructor(private readonly provisionService: ProvisionService) {}

  @Public() // TODO: secure this endpoint for S2S communication
  @Post()
  @ApiOperation({ summary: "Provision a new voucher code" })
  @ApiResponse({ status: 201, description: "Provision created." })
  async create(@Body() createProvisionDto: CreateProvisionDto) {
    return this.provisionService.create(createProvisionDto);
  }
}
