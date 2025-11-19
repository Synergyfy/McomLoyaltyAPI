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
import { Tier } from '../resources/tier/entities/tier.entity';
import { TierStatus } from '../resources/tier/entities/tier-status.enum';
import {
  Membership,
  MembershipStatus,
  PlanType,
} from '../resources/membership/entities/membership.entity';
import {
  PaymentHistory,
  PaymentProvider,
  PaymentStatus,
} from '../resources/payment-history/entities/payment-history.entity';

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
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: Repository<PaymentHistory>,
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
    const tiers = await this._seedTiers();
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
    const memberships = await this._seedMemberships(tiers, businesses);
    await this._seedPaymentHistories(memberships);

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
      'tier',
      'membership',
      'payment_history',
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

  private async _seedTiers() {
    return this.tierRepository.save([
      {
        name: 'Bronze',
        monthly_price: 10,
        quaterly_price: 25,
        annual_price: 90,
        features: ['Feature 1', 'Feature 2'],
        status: TierStatus.PUBLISHED,
      },
      {
        name: 'Silver',
        monthly_price: 20,
        quaterly_price: 50,
        annual_price: 180,
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        status: TierStatus.PUBLISHED,
      },
      {
        name: 'Gold',
        monthly_price: 30,
        quaterly_price: 75,
        annual_price: 270,
        features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
        status: TierStatus.PUBLISHED,
      },
    ]);
  }

  private async _seedMemberships(tiers: Tier[], businesses: Business[]) {
    const memberships = businesses.map((business, i) => {
      const plan_type =
        i % 3 === 0
          ? PlanType.MONTHLY
          : i % 3 === 1
          ? PlanType.QUARTERLY
          : PlanType.ANNUAL;
      const starts_at = new Date();
      let expires_at = new Date();
      if (plan_type === PlanType.MONTHLY) {
        expires_at.setMonth(starts_at.getMonth() + 1);
      } else if (plan_type === PlanType.QUARTERLY) {
        expires_at.setMonth(starts_at.getMonth() + 3);
      } else {
        expires_at.setFullYear(starts_at.getFullYear() + 1);
      }

      return {
        user_id: business.id,
        user_type: 'business',
        tier: tiers[i % tiers.length],
        status: MembershipStatus.ACTIVE,
        plan_type,
        starts_at,
        expires_at,
      };
    });
    return this.membershipRepository.save(memberships);
  }

  private async _seedPaymentHistories(memberships: Membership[]) {
    const paymentHistories = memberships.map((membership) => ({
      user_id: membership.user_id,
      user_type: membership.user_type,
      membership,
      amount:
        membership.plan_type === PlanType.MONTHLY
          ? membership.tier.monthly_price
          : membership.plan_type === PlanType.QUARTERLY
          ? membership.tier.quaterly_price
          : membership.tier.annual_price,
      payment_provider:
        Math.random() > 0.5 ? PaymentProvider.STRIPE : PaymentProvider.PAYPAL,
      transaction_id: nanoid(),
      status: PaymentStatus.SUCCEEDED,
    }));
    await this.paymentHistoryRepository.save(paymentHistories);
    console.log('PaymentHistory seeding completed!');
  }
}
