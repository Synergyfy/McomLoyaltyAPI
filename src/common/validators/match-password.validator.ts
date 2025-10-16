import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'matchPassword', async: false })
export class MatchPassword implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    return password === (args.object as any).password;
  }

  defaultMessage(args: ValidationArguments) {
    return `Passwords do not match`;
  }
}