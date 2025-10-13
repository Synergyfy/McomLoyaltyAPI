import { Injectable } from '@nestjs/common';
import { BusinessService } from 'src/resources/business/services/business.service';
import { StaffService } from 'src/resources/staff/services/staff.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly businessService: BusinessService,
    private readonly staffService: StaffService,
  ) {}

  async getBusinesses(page: number, limit: number) {
    return this.businessService.findAll(page, limit);
  }

  async getStaffs(businessId: string, page: number, limit: number) {
    return this.staffService.findAll(businessId, page, limit);
  }
}
