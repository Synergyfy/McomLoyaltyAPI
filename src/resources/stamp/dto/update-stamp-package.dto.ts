import { PartialType } from "@nestjs/swagger";
import { CreateStampPackageDto } from "./create-stamp-package.dto";

export class UpdateStampPackageDto extends PartialType(CreateStampPackageDto) {}
