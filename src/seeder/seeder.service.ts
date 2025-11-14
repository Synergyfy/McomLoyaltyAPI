import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { Admin } from '../resources/admin/entities/admin.entity';
import { Business } from '../resources/business/entities/business.entity';
import { Campaign } from '../resources/campaign/entities/campaign.entity';
import { Category } from '../resources/category/entities/category.entity';
import { Deal } from '../resources/deal/entities/deal.entity';
import { Otp } from '../resources/otp/entities/otp.entity';
import { Participant } from '../resources/participant/entities/participant.entity';
import { ParticipantCampaignBalance } from '../resources/participant-campaign-balance/entities/participant-campaign-balance.entity';
import { PointHistory } from '../resources/participant-campaign-balance/entities/point-history.entity';
import { Referral } from '../resources/referral/entities/referral.entity';
import { Reward } from '../resources/rewards/entities/reward.entity';
import { Sector } from '../resources/sector/entities/sector.entity';
import { Staff } from '../resources/staff/entities/staff.entity';
import { SubCategory } from '../resources/subcategory/entities/subcategory.entity';
import { CampaignType } from '../resources/campaign/entities/campaign.entity';
import { AudienceType } from '../resources/campaign/entities/campaign.entity';
import { Gender } from '../common/gender.enum';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

  async seed() {
    // Clear the database
    await this.clearDatabase();

    // Seed sectors
    const sectors = await this.sectorRepository.save([
      { name: 'Technology' },
      { name: 'Finance' },
      { name: 'Health' },
    ]);

    // Seed categories
    const categories = await this.categoryRepository.save([
      { name: 'Software', sector: sectors[0] },
      { name: 'Hardware', sector: sectors[0] },
      { name: 'Banking', sector: sectors[1] },
      { name: 'Insurance', sector: sectors[1] },
      { name: 'Hospitals', sector: sectors[2] },
      { name: 'Clinics', sector: sectors[2] },
    ]);

    // Seed subcategories
    const subcategories = await this.subCategoryRepository.save([
      { name: 'Development', category: categories[0] },
      { name: 'Design', category: categories[0] },
      { name: 'Laptops', category: categories[1] },
      { name: 'Mobile', category: categories[1] },
    ]);

    // Seed admins
    const hashedPassword = await bcrypt.hash('password', 10);
    const admins = await this.adminRepository.save([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
      },
    ]);

    // Seed businesses
    const businesses = [];
    for (let i = 0; i < 10; i++) {
      businesses.push({
        name: `Business ${i + 1}`,
        email: `business${i + 1}@example.com`,
        password: hashedPassword,
        uniqueCode: nanoid(9),
        affiliateCode: nanoid(9),
        subCategory: subcategories[i % subcategories.length],
      });
    }
    const savedBusinesses = await this.businessRepository.save(businesses);

    // Seed participants
    const participants = [];
    for (let i = 0; i < 50; i++) {
      participants.push({
        name: `Participant ${i + 1}`,
        email: `participant${i + 1}@example.com`,
        password: hashedPassword,
        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
        dateOfBirth: new Date(1990 + (i % 30), i % 12, i % 28),
        uniqueCode: nanoid(9),
      });
    }
    await this.participantRepository.save(participants);

    // Seed rewards
    const rewards = [];
    for (let i = 0; i < 20; i++) {
      rewards.push({
        title: `Reward ${i + 1}`,
        description: `Description for reward ${i + 1}`,
        points_required: 100 * (i + 1),
        value: 10 * (i + 1),
        image: 'https://example.com/reward.jpg',
      });
    }
    const savedRewards = await this.rewardRepository.save(rewards);

    // Seed campaigns
    const campaigns = [];
    for (let i = 0; i < 15; i++) {
      campaigns.push({
        name: `Campaign ${i + 1}`,
        campaign_type: CampaignType.QR_CODE,
        campaign_message: `Message for campaign ${i + 1}`,
        start_date: new Date(),
        end_date: new Date(new Date().getFullYear() + 1, 1, 1),
        quantity: 1000,
        audience_type: AudienceType.MEMBERS,
        banner_url: 'https://example.com/banner.jpg',
        cta_text: 'Join Now',
        cta_background_color: '#000000',
        cta_text_color: '#ffffff',
        text_color: '#000000',
        background_color: '#ffffff',
        business: savedBusinesses[i % savedBusinesses.length],
        rewards: [savedRewards[i % savedRewards.length]],
      });
    }
    await this.campaignRepository.save(campaigns);

    // Seed deals
    const deals = [];
    for (let i = 0; i < 30; i++) {
      deals.push({
        title: `Deal ${i + 1}`,
        description: `Description for deal ${i + 1}`,
        startDate: new Date(),
        endDate: new Date(new Date().getFullYear() + 1, 1, 1),
        termsAndConditions: 'Terms and conditions apply.',
        business: savedBusinesses[i % savedBusinesses.length],
        category: categories[i % categories.length],
      });
    }
    await this.dealRepository.save(deals);

    console.log('Seeding completed successfully!');
  }

  private async clearDatabase() {
    // Disable foreign key checks
    await this.adminRepository.query('SET session_replication_role = replica;');

    // Truncate all tables
    const tableNames = [
      'admins',
      'businesses',
      'campaigns',
      'categories',
      'deals',
      'otp',
      'participants',
      'participant_campaign_balances',
      'point_histories',
      'referrals',
      'reward',
      'sectors',
      'staff',
      'subcategories',
    ];

    for (const tableName of tableNames) {
      await this.adminRepository.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
    }

    // Re-enable foreign key checks
    await this.adminRepository.query('SET session_replication_role = DEFAULT;');
  }
}
