import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SystemSetting } from "../entities/system-setting.entity";
import { CreateSystemSettingDto } from "../dto/create-system-setting.dto";

@Injectable()
export class SystemSettingService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
  ) {}

  async set(
    createSystemSettingDto: CreateSystemSettingDto,
  ): Promise<SystemSetting> {
    let setting = await this.systemSettingRepository.findOne({
      where: { key: createSystemSettingDto.key },
    });

    if (setting) {
      setting.value = createSystemSettingDto.value;
      if (createSystemSettingDto.description) {
        setting.description = createSystemSettingDto.description;
      }
    } else {
      setting = this.systemSettingRepository.create(createSystemSettingDto);
    }

    return this.systemSettingRepository.save(setting);
  }

  async get(key: string): Promise<string | null> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });
    return setting ? setting.value : null;
  }

  async findAll(): Promise<SystemSetting[]> {
    return this.systemSettingRepository.find();
  }
}
