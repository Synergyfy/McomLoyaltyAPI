import { PartialType } from "@nestjs/swagger";
import { CreatePointPackageDto } from "./create-point-package.dto";

export class UpdatePointPackageDto extends PartialType(CreatePointPackageDto) {}
