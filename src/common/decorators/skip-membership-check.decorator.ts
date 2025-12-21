import { SetMetadata } from "@nestjs/common";

export const SKIP_MEMBERSHIP_CHECK_KEY = "skipMembershipCheck";
export const SkipMembershipCheck = () =>
  SetMetadata(SKIP_MEMBERSHIP_CHECK_KEY, true);
