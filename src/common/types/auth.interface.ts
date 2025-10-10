import { UserRole } from '../role.enum';

export interface createTokenInterface {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  userId?: string;
}
