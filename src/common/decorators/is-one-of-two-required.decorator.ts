import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ async: false })
export class IsOneOfTwoRequiredConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    // This validator is only for the case where isForThirdParty is true
    if (!(args.object as any).isForThirdParty) {
      return true;
    }
    // At least one of the two must be defined
    return value !== undefined || relatedValue !== undefined;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `Either ${args.property} or ${relatedPropertyName} must be provided when isForThirdParty is true.`;
  }
}

export function IsOneOfTwoRequired(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsOneOfTwoRequiredConstraint,
    });
  };
}
