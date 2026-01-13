import { Role } from "../role.enum";

export interface User {
  id: string;
  role: Role;
  email?: string;
  isEmailVerified?: boolean;
  hasActiveSubscription?: boolean;
  isSuperBusiness?: boolean;
}
