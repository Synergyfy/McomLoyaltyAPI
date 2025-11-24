import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { Admin } from '../resources/admin/entities/admin.entity';
import { Business } from '../resources/business/entities/business.entity';
import {
  Campaign,
} from '../resources/campaign/entities/campaign.entity';
import {
  CampaignType,
  AudienceType,
} from '../resources/campaign/entities/campaign-enums';
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
import { Partner } from '../resources/partner/entities/partner.entity';
import { QrPlaque, QrPlaqueStatus } from '../resources/qr-plaques/entities/qr-plaque.entity';
import { QrPlaqueScan } from '../resources/qr-plaques/entities/qr-plaque-scan.entity';
import { Membership } from '../resources/membership/entities/membership.entity';
import { Tier } from '../resources/tier/entities/tier.entity';
import { Coupon } from '../resources/coupon/entities/coupon.entity';
import { RewardType } from '../resources/rewards/enums/reward-type.enum';
import { BadgeLevel } from '../resources/rewards/enums/badge-level.enum';
import { RewardSource } from '../resources/rewards/enums/reward-source.enum';
import { RewardAudience } from '../resources/rewards/enums/reward-audience.enum';

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
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
    @InjectRepository(QrPlaque)
    private readonly qrPlaqueRepository: Repository<QrPlaque>,
    @InjectRepository(QrPlaqueScan)
    private readonly qrPlaqueScanRepository: Repository<QrPlaqueScan>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
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

    const partners = await this.partnerRepository.save(
        Array.from({ length: 5 }, (_, i) => ({
            name: `Partner ${i + 1}`,
            businessName: `Partner Biz ${i + 1}`,
            email: `partner${i + 1}@example.com`,
            phoneNumber: `+123456789${i}`,
            password: hashedPassword,
            subCategory: subcategories[0]
        }))
    );

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
        reward_type: RewardType.PHYSICAL_PRODUCT,
        badge_level: BadgeLevel.BRONZE,
        reward_source: RewardSource.MCOM_VAULT,
        audience: RewardAudience.ALL_BUSINESS,
      })),
    );

    const businessRewards = await this.rewardRepository.save(
      Array.from({ length: 15 }, (_, i) => ({
        title: `Business Reward ${i + 1}`,
        description: `Description for business reward ${i + 1}`,
        points_required: 150 * (i + 1),
        value: 15 * (i + 1),
        image: 'https://example.com/business_reward.jpg',
        reward_type: RewardType.COUPON,
        badge_level: BadgeLevel.SILVER,
        reward_source: RewardSource.PARTNER,
        audience: RewardAudience.ALL_BUSINESS,
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

    // Ensure every campaign has MULTIPLE rewards linked
    const allCampaigns = [...adminCampaigns, ...businessCampaigns];

    for (const campaign of allCampaigns) {
        const rewardsToAssign = campaign.business ? businessRewards : adminRewards;
        const shuffled = [...rewardsToAssign].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);

        // Update ManyToMany Relation
        campaign.rewards = selected;
        await this.campaignRepository.save(campaign);

        // Also create BusinessReward entries as before (metadata/catalogue)
        for (const reward of selected) {
             const exists = await this.businessRewardRepository.findOne({
                 where: {
                     campaign: { id: campaign.id },
                     reward: { id: reward.id }
                 }
             });

             if (!exists) {
                await this.businessRewardRepository.save({
                    business: campaign.business || businesses[0],
                    campaign,
                    reward,
                    point_required: 100 + Math.floor(Math.random() * 500),
                });
             }
        }
    }

    for (const business of businesses) {
        for (const campaign of adminCampaigns) {
            const shuffled = [...adminRewards].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 2);

            // For claimed admin campaigns, we might need to update the underlying campaign rewards?
            // No, admin campaigns are shared templates.
            // Businesses 'claim' them by creating 'BusinessCampaign' entity.
            // Does 'BusinessCampaign' have rewards? No.
            // When a business claims a campaign, they might want to customize rewards?
            // The `CampaignService.claimCampaign` creates `BusinessCampaign`.
            // It does NOT clone the campaign.
            // So if `findClaimedCampaigns` returns `campaign`, it returns the SHARED campaign.
            // So `campaign.rewards` will be the admin rewards we just assigned above.
            // That should be sufficient for the user's request.

            // But we also populate BusinessReward for completeness
            for(const reward of selected) {
                 await this.businessRewardRepository.save({
                    business,
                    campaign,
                    reward,
                    point_required: 200,
                });
            }
        }
    }

    // Participants join campaigns and EARN points
    for (const campaign of allCampaigns) {
        const shuffledParticipants = [...participants].sort(() => 0.5 - Math.random());
        const selectedParticipants = shuffledParticipants.slice(0, 20);

        for (const participant of selectedParticipants) {
            await this.participantCampaignBalanceRepository.save({
                participant,
                campaign,
                campaign_balance: 5000,
            });

             await this.pointHistoryRepository.save({
                type: PointHistoryType.EARN,
                points: 5000,
                participant,
                campaign,
                business: campaign.business || businesses[0],
                description: 'Initial seed earning'
            });
        }
    }

    // Simulate point redemptions (REDEEM)
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

    // QR Plaques
    const plaques = [];
    for(const business of businesses) {
        for(let i=0; i<3; i++) {
             const plaque = await this.qrPlaqueRepository.save({
                 code: nanoid(9),
                 assignedBusiness: business,
                 status: QrPlaqueStatus.ACTIVE,
                 link: `https://business${business.id}.com/menu`,
                 assignedPartner: partners[i % partners.length]
             });
             plaques.push(plaque);

             const scanCount = Math.floor(Math.random() * 50);
             for(let j=0; j<scanCount; j++) {
                 const date = new Date();
                 date.setDate(date.getDate() - Math.floor(Math.random() * 30));

                 const scan = this.qrPlaqueScanRepository.create({
                     qrPlaque: plaque,
                     scannedAt: date
                 });
                 await this.qrPlaqueScanRepository.save(scan);
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
      'partners',
      'qr_plaques',
      'qr_plaque_scans',
      'membership',
      'tier',
      'coupon'
    ];

    for (const tableName of tableNames) {
      try {
        await this.adminRepository.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
        );
      } catch (error) {
        // console.error(`Error truncating table ${tableName}:`, error.message);
      }
    }

    await this.adminRepository.query('SET session_replication_role = DEFAULT;');
  }
}
