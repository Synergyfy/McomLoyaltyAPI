import { Role } from "../role.enum";

export interface createTokenInterface {
  sub: string;
  name: string;
  email: string;
  role: Role;
  userId?: string;
}
