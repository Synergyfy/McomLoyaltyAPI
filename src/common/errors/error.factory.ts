import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exception";

export const ErrorFactory = {
  userNotFound: () =>
    new AppException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"),

  passwordsFieldMismatch: () =>
    new AppException(
      "Password fields do not match",
      HttpStatus.BAD_REQUEST,
      "PASSWORD_MISMATCH",
    ),

  existingEmail: () =>
    new AppException(
      "This email has been used",
      HttpStatus.CONFLICT,
      "EMAIL_EXISTS",
    ),
  existingPhoneNumber: () =>
    new AppException(
      "This phone number has been used",
      HttpStatus.CONFLICT,
      "NUMBER_EXISTS",
    ),

  invalidCredentials: () =>
    new AppException(
      "Invalid email or password",
      HttpStatus.BAD_REQUEST,
      "INVALID_CREDENTIALS",
    ),

  permissionError: () =>
    new AppException(
      "You don't have permission to get an API Key",
      HttpStatus.FORBIDDEN,
      "NO_API_PERMISSION",
    ),

  businessError: () =>
    new AppException(
      "Error fetching your business",
      HttpStatus.BAD_REQUEST,
      "BUSINESS_FETCH_FAILED",
    ),

  campaignError: () =>
    new AppException(
      "Error fetching your campaign",
      HttpStatus.BAD_REQUEST,
      "CAMPAIGN_FETCH_FAILED",
    ),

  campaignNotFound: () =>
    new AppException(
      "Campaign not found",
      HttpStatus.NOT_FOUND,
      "CAMPAIGN_NOT_FOUND",
    ),

  codeNotFound: () =>
    new AppException(
      "Code does not exist or has expired",
      HttpStatus.NOT_FOUND,
      "CODE_NOT_FOUND",
    ),

  staffNotFound: () =>
    new AppException(
      "Staff not found",
      HttpStatus.NOT_FOUND,
      "STAFF_NOT_FOUND",
    ),

  insufficientBalance: () =>
    new AppException(
      "Insufficient balance to redeem reward",
      HttpStatus.UNPROCESSABLE_ENTITY,
      "INSUFFICIENT_BALANCE",
    ),

  maxCodeUsage: () =>
    new AppException(
      "Code usage has been maxed ",
      HttpStatus.UNPROCESSABLE_ENTITY,
      "MAX_CODE_USAGE",
    ),
};
