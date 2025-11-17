import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { Admin } from '../resources/admin/entities/admin.entity';
import { Business } from '../resources/business/entities/business.entity';
import {
  Campaign,
  CampaignType,
  AudienceType,
} from '../resources/campaign/entities/campaign.entity';
import { Category } from '../resources/category/entities/category.entity';
import { Deal } from '../resources/deal/entities/deal.entity';
import { Otp } from '../resources/otp/entities/otp.entity';
import { Participant } from '../resources/participant/entities/participant.entity';
import { ParticipantCampaignBalance } from '../resources/participant-campaign-balance/entities/participant-campaign-balance.entity';
import {
  PointHistory,
  PointHistoryType,
} from '../resources/participant-campaign-balance/entities/point-history.entity';
import { Referral } from '../resources/referral/entities/referral.entity';
import { Reward } from '../resources/rewards/entities/reward.entity';
import { BusinessReward } from '../resources/rewards/entities/business-reward.entity';
import { Sector } from '../resources/sector/entities/sector.entity';
import { Staff } from '../resources/staff/entities/staff.entity';
import { SubCategory } from '../resources/subcategory/entities/subcategory.entity';
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
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

  async seed() {
    await this.clearDatabase();

    const sectors = await this.sectorRepository.save([
      { name: 'Technology' },
      { name: 'Retail' },
    ]);
    const categories = await this.categoryRepository.save([
      { name: 'Software', sector: sectors[0] },
      { name: 'Fashion', sector: sectors[1] },
    ]);
    const subcategories = await this.subCategoryRepository.save([
      { name: 'Web Development', category: categories[0] },
      { name: 'Clothing', category: categories[1] },
    ]);
    const hashedPassword = await bcrypt.hash('password', 10);

    const admins = await this.adminRepository.save([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
      },
    ]);

    const businesses = await this.businessRepository.save(
      Array.from({ length: 20 }, (_, i) => ({
        name: `Business ${i + 1}`,
        email: `business${i + 1}@example.com`,
        password: hashedPassword,
        uniqueCode: nanoid(9),
        affiliateCode: nanoid(9),
        subCategory: subcategories[i % subcategories.length],
      })),
    );

    const participants = await this.participantRepository.save(
      Array.from({ length: 100 }, (_, i) => ({
        name: `Participant ${i + 1}`,
        email: `participant${i + 1}@example.com`,
        password: hashedPassword,
        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
        dateOfBirth: new Date(1990 + (i % 30), i % 12, i % 28 || 1),
        uniqueCode: nanoid(9),
      })),
    );

    const adminRewards = await this.rewardRepository.save(
      Array.from({ length: 5 }, (_, i) => ({
        title: `Admin Reward ${i + 1}`,
        description: `Description for admin reward ${i + 1}`,
        points_required: 100 * (i + 1),
        value: 10 * (i + 1),
        image: 'https://example.com/admin_reward.jpg',
      })),
    );

    const businessRewards = await this.rewardRepository.save(
      Array.from({ length: 15 }, (_, i) => ({
        title: `Business Reward ${i + 1}`,
        description: `Description for business reward ${i + 1}`,
        points_required: 150 * (i + 1),
        value: 15 * (i + 1),
        image: 'https://example.com/business_reward.jpg',
        business: businesses[i % businesses.length],
      })),
    );

    const adminCampaigns = await this.campaignRepository.save(
      Array.from({ length: 3 }, (_, i) => ({
        name: `Admin Campaign ${i + 1}`,
        campaign_type: CampaignType.QR_CODE,
        start_date: new Date(),
        end_date: new Date(new Date().getFullYear() + 1, 1, 1),
        quantity: 1000,
        audience_type: AudienceType.MEMBERS,
        business: null,
        campaign_message: `Message for admin campaign ${i + 1}`,
        banner_url: 'https://example.com/banner.jpg',
        cta_text: 'Click Here',
        cta_background_color: '#ffffff',
        cta_text_color: '#000000',
        text_color: '#000000',
        background_color: '#ffffff',
      })),
    );

    const businessCampaigns = await this.campaignRepository.save(
      Array.from({ length: 10 }, (_, i) => ({
        name: `Business Campaign ${i + 1}`,
        campaign_type: CampaignType.QR_CODE,
        start_date: new Date(),
        end_date: new Date(new Date().getFullYear() + 1, 1, 1),
        quantity: 500,
        audience_type: AudienceType.MEMBERS,
        business: businesses[i % businesses.length],
        campaign_message: `Message for business campaign ${i + 1}`,
        banner_url: 'https://example.com/banner.jpg',
        cta_text: 'Click Here',
        cta_background_color: '#ffffff',
        cta_text_color: '#000000',
        text_color: '#000000',
        background_color: '#ffffff',
      })),
    );

    // Businesses claim admin rewards for admin campaigns
    for (const business of businesses) {
      for (const campaign of adminCampaigns) {
        await this.businessRewardRepository.save({
          business,
          campaign,
          reward: adminRewards[Math.floor(Math.random() * adminRewards.length)],
          point_required: 200,
        });
      }
    }

    // Businesses add their own rewards to their own campaigns
    for (const campaign of businessCampaigns) {
      await this.businessRewardRepository.save({
        business: campaign.business,
        campaign,
        reward:
          businessRewards[
            Math.floor(Math.random() * businessRewards.length)
          ],
        point_required: 300,
      });
    }

    // Simulate point redemptions
    const allCampaigns = [...adminCampaigns, ...businessCampaigns];
    for (const participant of participants) {
      for (let i = 0; i < 5; i++) {
        const campaign =
          allCampaigns[Math.floor(Math.random() * allCampaigns.length)];
        const businessReward = await this.businessRewardRepository.findOne({
          where: { campaign: { id: campaign.id } },
          relations: ['reward', 'business'],
        });

        if (businessReward) {
          await this.pointHistoryRepository.save({
            type: PointHistoryType.REDEEM,
            points: businessReward.point_required,
            participant,
            campaign,
            reward: businessReward.reward,
            business: businessReward.business,
          });
        }
      }
    }

    console.log('Seeding completed successfully!');
  }

  private async clearDatabase() {
    await this.adminRepository.query('SET session_replication_role = replica;');
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
      'business_reward',
      'sectors',
      'staff',
      'subcategories',
    ];

    for (const tableName of tableNames) {
      try {
        await this.adminRepository.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
        );
      } catch (error) {
        console.error(`Error truncating table ${tableName}:`, error.message);
      }
    }

    await this.adminRepository.query('SET session_replication_role = DEFAULT;');
  }
}
