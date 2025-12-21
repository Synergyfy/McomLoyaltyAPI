import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class PartnerLocalAuthGuard extends AuthGuard("partner-local") {}
