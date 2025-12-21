import * as bcrypt from "bcrypt";
import { Injectable } from "@nestjs/common";

@Injectable()
export class HashService {
  private readonly saltRound = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRound);
  }

  async comparePassword(password: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(password, hashed);
  }
}
