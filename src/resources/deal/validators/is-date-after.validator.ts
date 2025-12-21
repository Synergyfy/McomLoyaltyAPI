import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { Injectable } from "@nestjs/common";

@ValidatorConstraint({ name: "isDateAfter", async: false })
@Injectable()
export class IsDateAfter implements ValidatorConstraintInterface {
  validate(propertyValue: string, args: ValidationArguments) {
    return new Date(propertyValue) > new Date(args.object[args.constraints[0]]);
  }

  defaultMessage(args: ValidationArguments) {
    return `"${args.property}" must be after "${args.constraints[0]}"`;
  }
}
