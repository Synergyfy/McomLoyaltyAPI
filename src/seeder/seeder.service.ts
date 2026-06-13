import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { nanoid } from "nanoid";
import * as bcrypt from "bcrypt";
import { Admin } from "../resources/admin/entities/admin.entity";
import { Business } from "../resources/business/entities/business.entity";
import { Campaign } from "../resources/campaign/entities/campaign.entity";
import { BusinessCampaign } from "../resources/campaign/entities/business-campaign.entity";
import {
  CampaignType,
  AudienceType,
} from "../resources/campaign/entities/campaign-enums";
import { Category } from "../resources/category/entities/category.entity";
import { Deal } from "../resources/deal/entities/deal.entity";
import { Otp } from "../resources/otp/entities/otp.entity";
import { Participant } from "../resources/participant/entities/participant.entity";
import { ParticipantCampaignBalance } from "../resources/participant-campaign-balance/entities/participant-campaign-balance.entity";
import {
  PointHistory,
  PointHistoryType,
} from "../resources/participant-campaign-balance/entities/point-history.entity";
import { Referral } from "../resources/referral/entities/referral.entity";
import { Reward } from "../resources/rewards/entities/reward.entity";
import { BusinessReward } from "../resources/rewards/entities/business-reward.entity";
import { Sector } from "../resources/sector/entities/sector.entity";
import { Staff } from "../resources/staff/entities/staff.entity";
import { SubCategory } from "../resources/subcategory/entities/subcategory.entity";
import { Gender } from "../common/gender.enum";
import { Partner } from "../resources/partner/entities/partner.entity";
import {
  QrPlaque,
  QrPlaqueStatus,
} from "../resources/qr-plaques/entities/qr-plaque.entity";
import { Membership, MembershipStatus, PlanType } from "../resources/membership/entities/membership.entity";
import { Tier } from "../resources/tier/entities/tier.entity";
import { Coupon } from "../resources/coupon/entities/coupon.entity";
import { RewardType } from "../resources/rewards/enums/reward-type.enum";
import { BadgeLevel } from "../resources/rewards/enums/badge-level.enum";
import { RewardSource } from "../resources/rewards/enums/reward-source.enum";
import { RewardAudience } from "../resources/rewards/enums/reward-audience.enum";
import { RewardStatus } from "../resources/rewards/enums/reward-status.enum";
import { TierStatus } from "../resources/tier/entities/tier-status.enum";
import {
  PaymentHistory,
  PaymentProvider,
  PaymentStatus,
} from "../resources/payment-history/entities/payment-history.entity";
import { ReferralStatus } from "../resources/referral/entities/referral.entity";

interface TaxonomySector {
  sector: string;
  categories: {
    name: string;
    subcategories: string[];
  }[];
}

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
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
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: Repository<PaymentHistory>,
  ) {}

  async seed() {
    await this.clearDatabase();

    const taxonomyData: TaxonomySector[] = [
      {
        sector: "Food & Beverage",
        categories: [
          {
            name: "Restaurants & Dining",
            subcategories: ["Fine Dining", "Fast Food", "Casual Dining", "Cafes & Bakeries", "Buffets"],
          },
          {
            name: "Specialty Food & Drink",
            subcategories: ["Desserts & Ice Cream", "Juice Bars & Smoothies", "Wineries & Breweries", "Tea Rooms"],
          },
        ],
      },
      {
        sector: "Retail & Shopping",
        categories: [
          {
            name: "Apparel & Fashion",
            subcategories: ["Men's Clothing", "Women's Clothing", "Kids & Baby Wear", "Footwear", "Accessories & Jewelry"],
          },
          {
            name: "Electronics & Gadgets",
            subcategories: ["Mobile Phones & Accessories", "Computers & Laptops", "Home Appliances", "Audio & Video"],
          },
          {
            name: "Home & Living",
            subcategories: ["Furniture", "Home Decor", "Kitchenware", "Bedding & Bath"],
          },
          {
            name: "Beauty & Personal Care",
            subcategories: ["Cosmetics", "Skincare", "Fragrances", "Hair Care Products"],
          },
        ],
      },
      {
        sector: "Health & Wellness",
        categories: [
          {
            name: "Fitness & Sports",
            subcategories: ["Gyms & Fitness Centers", "Yoga & Pilates Studios", "Sports Equipment", "Personal Training"],
          },
          {
            name: "Medical & Pharmacy",
            subcategories: ["Pharmacies", "Dental Clinics", "Opticians & Eyewear", "Chiropractic & Physical Therapy"],
          },
          {
            name: "Spa & Relaxation",
            subcategories: ["Massage Therapy", "Day Spas", "Wellness Retreats"],
          },
        ],
      },
      {
        sector: "Entertainment & Leisure",
        categories: [
          {
            name: "Amusements & Activities",
            subcategories: ["Movie Theaters", "Bowling Alleys", "Arcades & Gaming Zones", "Theme Parks"],
          },
          {
            name: "Arts & Culture",
            subcategories: ["Museum & Galleries", "Theaters & Concert Halls", "Music & Art Classes"],
          },
        ],
      },
      {
        sector: "Services",
        categories: [
          {
            name: "Automotive Services",
            subcategories: ["Car Wash & Detailing", "Auto Repair & Maintenance", "Tire Shops"],
          },
          {
            name: "Personal Services",
            subcategories: ["Hair Salons & Barbers", "Nail Salons", "Dry Cleaning & Laundry", "Pet Grooming"],
          },
        ],
      },
    ];

    const sectors: Sector[] = [];
    const categories: Category[] = [];
    const subcategories: SubCategory[] = [];

    for (const item of taxonomyData) {
      const sector = await this.sectorRepository.save({ name: item.sector });
      sectors.push(sector);

      for (const catItem of item.categories) {
        const category = await this.categoryRepository.save({
          name: catItem.name,
          sector: sector,
        });
        categories.push(category);

        for (const subName of catItem.subcategories) {
          const subCategory = await this.subCategoryRepository.save({
            name: subName,
            category: category,
          });
          subcategories.push(subCategory);
        }
      }
    }

    const hashedPassword = await bcrypt.hash("password", 10);

    const admins = await this.adminRepository.save([
      {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
      },
    ]);

    const tiers = await this.tierRepository.save([
      {
        name: "Bronze",
        status: TierStatus.PUBLISHED,
        monthly_price: 10,
        quarterly_price: 25,
        annual_price: 90,
        features: ["Basic analytics", "1 active campaign", "Up to 100 participants"],
      },
      {
        name: "Silver",
        status: TierStatus.PUBLISHED,
        monthly_price: 20,
        quarterly_price: 50,
        annual_price: 180,
        features: ["Advanced analytics", "5 active campaigns", "Up to 1000 participants"],
      },
      {
        name: "Gold",
        status: TierStatus.PUBLISHED,
        monthly_price: 30,
        quarterly_price: 75,
        annual_price: 270,
        features: ["Premium analytics", "Unlimited campaigns", "Unlimited participants"],
      },
    ]);

    const partners = await this.partnerRepository.save(
      Array.from({ length: 5 }, (_, i) => ({
        name: `Partner ${i + 1}`,
        businessName: `Partner Biz ${i + 1}`,
        email: `partner${i + 1}@example.com`,
        phoneNumber: `+123456789${i}`,
        password: hashedPassword,
        subCategory: subcategories[0],
      })),
    );

    // Create 50 Businesses
    console.log("Creating businesses...");
    const businesses = await this.businessRepository.save(
      Array.from({ length: 50 }, (_, i) => ({
        name: `Business ${i + 1}`,
        email: `business${i + 1}@example.com`,
        password: hashedPassword,
        uniqueCode: nanoid(9),
        affiliateCode: nanoid(9),
        subCategory: subcategories[i % subcategories.length],
        sector: sectors[i % sectors.length],
      })),
    );

    // Assign Memberships and create Payment History
    for (const [index, business] of businesses.entries()) {
      const tier = tiers[index % tiers.length];
      const membership = await this.membershipRepository.save({
        business: business,
        tier: tier,
        status: MembershipStatus.ACTIVE,
        plan_type: PlanType.MONTHLY,
        starts_at: this.getDateDaysAgo(30),
        expires_at: this.getDateDaysAgo(-335),
      });
      await this.paymentHistoryRepository.save({
        user: business,
        user_type: "business",
        membership: membership,
        amount: tier.monthly_price,
        payment_provider: PaymentProvider.STRIPE,
        status: PaymentStatus.SUCCEEDED,
        transaction_id: nanoid(10),
      });
    }

    // Create QR Plaques (No Scans)
    const qrPlaques = await this.qrPlaqueRepository.save(
      Array.from({ length: 20 }, (_, i) => {
        const code = nanoid(9).toUpperCase();
        return {
          uniqueCode: code,
          code: code,
          name: `Plaque ${i + 1}`,
          description: `Description for Plaque ${i + 1}`,
          actionText: "Scan to Earn",
          contentUrl: `https://mcom.example.com/plaque/${code}`,
          status: QrPlaqueStatus.ACTIVE,
          assignedPartner: partners[i % partners.length],
          assignedBusiness: businesses[i % businesses.length],
        };
      }),
    );

    // Create Referrals
    for (let i = 0; i < businesses.length; i++) {
      if (i > 0) {
        await this.referralRepository.save({
          referrerBusiness: businesses[i - 1],
          refereeBusiness: businesses[i],
          status: ReferralStatus.SUCCESSFUL,
          code: "SEED",
          refereeEmail: businesses[i].email,
        });
      }
    }

    // Create Staff for each business
    console.log("Creating staff...");
    const staffs = [];
    for (const business of businesses) {
      const staffList = await this.staffRepository.save(
        Array.from({ length: 2 }, (_, i) => ({
          name: `Staff ${i + 1} of ${business.name}`,
          email: `staff${i + 1}_${business.uniqueCode}@example.com`,
          password: hashedPassword,
          uniqueCode: nanoid(9),
          business: business,
        })),
      );
      staffs.push(...staffList);
    }

    // Create Participants (200)
    console.log("Creating participants...");
    const participants = await this.participantRepository.save(
      Array.from({ length: 200 }, (_, i) => ({
        name: `Participant ${i + 1}`,
        email: `participant${i + 1}@example.com`,
        password: hashedPassword,
        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
        dateOfBirth: new Date(1990 + (i % 30), i % 12, i % 28 || 1),
        uniqueCode: nanoid(9),
      })),
    );

    // Admin Campaigns (Templates)
    const adminCampaigns = await this.campaignRepository.save(
      Array.from({ length: 5 }, (_, i) => ({
        name: `Admin Template Campaign ${i + 1}`,
        campaign_type: CampaignType.QR_CODE,
        start_date: this.getDateDaysAgo(100),
        end_date: this.getDateDaysAgo(-100), // Future
        quantity: 10000,
        audience_type: AudienceType.MEMBERS,
        business: null,
        campaign_message: `Message for admin campaign ${i + 1}`,
        banner_url: "https://placehold.co/600x400",
        cta_text: "Click Here",
        cta_background_color: "#ffffff",
        cta_text_color: "#000000",
        text_color: "#000000",
        background_color: "#ffffff",
        uniqueCode: nanoid(9),
      })),
    );

    const adminRewards = await this.rewardRepository.save(
      Array.from({ length: 10 }, (_, i) => ({
        title: `Generic Reward ${i + 1}`,
        description: `Description for generic reward ${i + 1}`,
        max_points: 100 * (i + 1),
        value: 10 * (i + 1),
        image: "https://placehold.co/100x100",
        reward_type: RewardType.PHYSICAL_PRODUCT,
        badge_level: BadgeLevel.BRONZE,
        reward_source: RewardSource.MCOM_VAULT,
        audience: RewardAudience.ALL_BUSINESS,
        quantity: 1000,
        status: RewardStatus.ACTIVE,
      })),
    );

    // Link Admin Rewards to Admin Campaigns
    for (const campaign of adminCampaigns) {
      campaign.rewards = adminRewards.slice(0, 3);
      await this.campaignRepository.save(campaign);
    }

    console.log("Creating business campaigns...");
    // Business Campaigns (Mix of custom and claimed)
    // We will focus on BusinessCampaign entity as that's what Analytics uses
    const allBusinessCampaigns: BusinessCampaign[] = [];

    for (const business of businesses) {
      // Create 2 custom campaigns per business
      for (let i = 0; i < 2; i++) {
        const customCampaign = await this.businessCampaignRepository.save({
          business: business,
          name: `${business.name} Campaign ${i + 1}`,
          uniqueCode: nanoid(9),
          campaign_type: CampaignType.QR_CODE,
          campaign_message: `Welcome to ${business.name}! Scan to earn.`,
          start_date: this.getDateDaysAgo(90),
          end_date: this.getDateDaysAgo(-90),
          quantity: 1000,
          audience_type: AudienceType.MEMBERS,
          banner_url: "https://placehold.co/600x400",
          cta_text: "Join Now",
          cta_background_color: "#000",
          cta_text_color: "#fff",
          text_color: "#000",
          background_color: "#fff",
          total_points_earned: 0,
          total_points_redeemed: 0,
        });

        // Create custom rewards for this campaign
        const customRewards = await this.rewardRepository.save(
          Array.from({ length: 2 }, (_, r) => ({
            title: `${business.name} Reward ${r + 1}`,
            description: `Exclusive from ${business.name}`,
            max_points: 200 * (r + 1),
            value: 20 * (r + 1),
            image: "https://placehold.co/100x100",
            reward_type: RewardType.COUPON,
            badge_level: BadgeLevel.SILVER,
            reward_source: RewardSource.PARTNER,
            audience: RewardAudience.ALL_BUSINESS,
            status: RewardStatus.ACTIVE,
            quantity: 100,
          })),
        );

        // Create and link BusinessRewards to BusinessCampaign
        const businessRewards = [];
        for (const reward of customRewards) {
          const br = await this.businessRewardRepository.save({
            business: business,
            reward: reward,
            points_required: reward.max_points,
            title: reward.title,
            description: reward.description,
            reward_type: reward.reward_type as any,
            image: reward.image,
          });
          businessRewards.push(br);
        }
        customCampaign.businessRewards = businessRewards;
        await this.businessCampaignRepository.save(customCampaign);

        allBusinessCampaigns.push(customCampaign);
      }

      // Claim 1 Admin Template
      const template =
        adminCampaigns[Math.floor(Math.random() * adminCampaigns.length)];
      const claimedCampaign = await this.businessCampaignRepository.save({
        business: business,
        campaign: template, // Link to template
        name: `${business.name} (Claimed) ${template.name}`,
        uniqueCode: nanoid(9),
        campaign_type: template.campaign_type,
        campaign_message: template.campaign_message,
        start_date: this.getDateDaysAgo(90),
        end_date: this.getDateDaysAgo(-90),
        quantity: template.quantity,
        audience_type: template.audience_type,
        banner_url: template.banner_url,
        cta_text: template.cta_text,
        cta_background_color: template.cta_background_color,
        cta_text_color: template.cta_text_color,
        text_color: template.text_color,
        background_color: template.background_color,
        total_points_earned: 0,
        total_points_redeemed: 0,
      });

      // Create and link BusinessRewards from template to this BusinessCampaign
      const claimedBusinessRewards = [];
      for (const reward of template.rewards) {
        const br = await this.businessRewardRepository.save({
          business: business,
          reward: reward,
          points_required: reward.max_points,
          title: reward.title,
          description: reward.description,
          reward_type: reward.reward_type as any,
          image: reward.image,
        });
        claimedBusinessRewards.push(br);
      }
      claimedCampaign.businessRewards = claimedBusinessRewards;
      await this.businessCampaignRepository.save(claimedCampaign);

      allBusinessCampaigns.push(claimedCampaign);
    }

    console.log("Generating historical data (Point History)...");

    // Historical Simulation: Past 90 Days
    const days = 90;
    const today = new Date();

    for (let d = days; d >= 0; d--) {
      const currentDate = new Date();
      currentDate.setDate(today.getDate() - d);
      // Randomize time within the day
      currentDate.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
      );

      // 1. Random Participants join campaigns (EARN points or just join)
      // Let's assume 10-20 joins per day across the system
      const dailyJoins = Math.floor(Math.random() * 10) + 10;

      for (let j = 0; j < dailyJoins; j++) {
        const participant =
          participants[Math.floor(Math.random() * participants.length)];
        const bizCampaign =
          allBusinessCampaigns[
            Math.floor(Math.random() * allBusinessCampaigns.length)
          ];

        // Check if already joined
        let balance = await this.participantCampaignBalanceRepository.findOne({
          where: {
            participant: { id: participant.id },
            businessCampaign: { id: bizCampaign.id },
          },
        });

        if (!balance) {
          // Join
          const earnPoints = 100; // Sign up bonus
          balance = await this.participantCampaignBalanceRepository.save({
            participant,
            businessCampaign: bizCampaign,
            campaign: bizCampaign.campaign, // Nullable if custom
            campaign_balance: earnPoints,
            created_at: currentDate,
          });

          // Update BusinessCampaign total
          bizCampaign.total_points_earned += earnPoints;
          // No save here, batch update later or rely on memory? Better to save to keep consistency if queried.
          // We'll save bizCampaign at end of loop or periodically?
          // Let's save now to be safe, though slow.
          await this.businessCampaignRepository.save(bizCampaign);

          // Log History
          await this.pointHistoryRepository.save({
            type: PointHistoryType.EARN,
            points: earnPoints,
            participant,
            businessCampaign: bizCampaign,
            campaign: bizCampaign.campaign,
            business: bizCampaign.business,
            description: "Campaign Join Bonus",
            created_at: currentDate,
          });
        } else {
          // Already joined, maybe earn more points (Scan)
          if (Math.random() > 0.5) {
            const earnPoints = 50 + Math.floor(Math.random() * 100);
            balance.campaign_balance += earnPoints;
            await this.participantCampaignBalanceRepository.save(balance);

            bizCampaign.total_points_earned += earnPoints;
            await this.businessCampaignRepository.save(bizCampaign);

            await this.pointHistoryRepository.save({
              type: PointHistoryType.EARN,
              points: earnPoints,
              participant,
              businessCampaign: bizCampaign,
              campaign: bizCampaign.campaign,
              business: bizCampaign.business,
              description: "Scan Earn",
              created_at: currentDate,
            });
          }
        }
      }

      // 2. Random Redemptions
      // Let's assume 5-10 redemptions per day
      const dailyRedemptions = Math.floor(Math.random() * 5) + 5;
      for (let r = 0; r < dailyRedemptions; r++) {
        // Pick a random participant
        const participant =
          participants[Math.floor(Math.random() * participants.length)];

        // Find a campaign they have balance in
        const balance = await this.participantCampaignBalanceRepository
          .createQueryBuilder("pcb")
          .leftJoinAndSelect("pcb.businessCampaign", "bc")
          .leftJoinAndSelect("bc.businessRewards", "br")
          .where("pcb.participantId = :pid", { pid: participant.id })
          .andWhere("pcb.campaign_balance > 0")
          .orderBy("RANDOM()")
          .getOne();

        if (
          balance &&
          balance.businessCampaign &&
          balance.businessCampaign.businessRewards.length > 0
        ) {
          const businessReward = balance.businessCampaign.businessRewards[0]; // Just pick the first available
          if (balance.campaign_balance >= businessReward.points_required) {
            // Redeem
            balance.campaign_balance -= businessReward.points_required;
            await this.participantCampaignBalanceRepository.save(balance);

            const bizCampaign = balance.businessCampaign;
            bizCampaign.total_points_redeemed += businessReward.points_required;
            await this.businessCampaignRepository.save(bizCampaign);

            await this.pointHistoryRepository.save({
              type: PointHistoryType.REDEEM,
              points: businessReward.points_required,
              participant,
              businessCampaign: bizCampaign,
              campaign: bizCampaign.campaign,
              business: bizCampaign.business,
              reward: businessReward.reward,
              description: `Redeemed ${businessReward.title}`,
              created_at: currentDate,
            });
          }
        }
      }
    }

    console.log("Seeding completed successfully!");
  }

  async seedTaxonomy(): Promise<void> {
    const taxonomyData: TaxonomySector[] = [
      {
        sector: "Food & Beverage",
        categories: [
          {
            name: "Restaurants & Dining",
            subcategories: ["Fine Dining", "Fast Food", "Casual Dining", "Cafes & Bakeries", "Buffets"],
          },
          {
            name: "Specialty Food & Drink",
            subcategories: ["Desserts & Ice Cream", "Juice Bars & Smoothies", "Wineries & Breweries", "Tea Rooms"],
          },
        ],
      },
      {
        sector: "Retail & Shopping",
        categories: [
          {
            name: "Apparel & Fashion",
            subcategories: ["Men's Clothing", "Women's Clothing", "Kids & Baby Wear", "Footwear", "Accessories & Jewelry"],
          },
          {
            name: "Electronics & Gadgets",
            subcategories: ["Mobile Phones & Accessories", "Computers & Laptops", "Home Appliances", "Audio & Video"],
          },
          {
            name: "Home & Living",
            subcategories: ["Furniture", "Home Decor", "Kitchenware", "Bedding & Bath"],
          },
          {
            name: "Beauty & Personal Care",
            subcategories: ["Cosmetics", "Skincare", "Fragrances", "Hair Care Products"],
          },
        ],
      },
      {
        sector: "Health & Wellness",
        categories: [
          {
            name: "Fitness & Sports",
            subcategories: ["Gyms & Fitness Centers", "Yoga & Pilates Studios", "Sports Equipment", "Personal Training"],
          },
          {
            name: "Medical & Pharmacy",
            subcategories: ["Pharmacies", "Dental Clinics", "Opticians & Eyewear", "Chiropractic & Physical Therapy"],
          },
          {
            name: "Spa & Relaxation",
            subcategories: ["Massage Therapy", "Day Spas", "Wellness Retreats"],
          },
        ],
      },
      {
        sector: "Entertainment & Leisure",
        categories: [
          {
            name: "Amusements & Activities",
            subcategories: ["Movie Theaters", "Bowling Alleys", "Arcades & Gaming Zones", "Theme Parks"],
          },
          {
            name: "Arts & Culture",
            subcategories: ["Museum & Galleries", "Theaters & Concert Halls", "Music & Art Classes"],
          },
        ],
      },
      {
        sector: "Services",
        categories: [
          {
            name: "Automotive Services",
            subcategories: ["Car Wash & Detailing", "Auto Repair & Maintenance", "Tire Shops"],
          },
          {
            name: "Personal Services",
            subcategories: ["Hair Salons & Barbers", "Nail Salons", "Dry Cleaning & Laundry", "Pet Grooming"],
          },
        ],
      },
    ];

    console.log("Seeding taxonomy (Sectors, Categories, Subcategories)...");

    for (const item of taxonomyData) {
      let sector = await this.sectorRepository.findOne({
        where: { name: item.sector },
      });

      if (!sector) {
        sector = await this.sectorRepository.save({ name: item.sector });
        console.log(`Created Sector: ${sector.name}`);
      }

      for (const catItem of item.categories) {
        let category = await this.categoryRepository.findOne({
          where: { name: catItem.name },
          relations: ["sector"],
        });

        if (!category) {
          category = await this.categoryRepository.save({
            name: catItem.name,
            sector: sector,
          });
          console.log(`Created Category: ${category.name} in Sector: ${sector.name}`);
        } else if (category.sector?.id !== sector.id) {
          category.sector = sector;
          category = await this.categoryRepository.save(category);
          console.log(`Updated Category: ${category.name} to Sector: ${sector.name}`);
        }

        for (const subName of catItem.subcategories) {
          let subCategory = await this.subCategoryRepository.findOne({
            where: { name: subName },
            relations: ["category"],
          });

          if (!subCategory) {
            subCategory = await this.subCategoryRepository.save({
              name: subName,
              category: category,
            });
            console.log(`Created Subcategory: ${subCategory.name} in Category: ${category.name}`);
          } else if (subCategory.category?.id !== category.id) {
            subCategory.category = category;
            subCategory = await this.subCategoryRepository.save(subCategory);
            console.log(`Updated Subcategory: ${subCategory.name} to Category: ${category.name}`);
          }
        }
      }
    }

    console.log("Taxonomy seeding completed successfully!");
  }

  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private async clearDatabase() {
    await this.adminRepository.query("SET session_replication_role = replica;");
    const tableNames = [
      "admins",
      "businesses",
      "campaigns",
      "business_campaigns",
      "categories",
      "deals",
      "otp",
      "participants",
      "participant_campaign_balances",
      "point_histories",
      "referrals",
      "reward",
      "business_reward",
      "sectors",
      "staff",
      "subcategories",
      "partners",
      "qr_plaques",
      "membership",
      "tier",
      "payment_history",
      "coupon",
      "business_campaign_rewards", // join tables
      "campaign_target_tiers",
      "campaigns_rewards_reward",
      "reward_sectors_sector",
      "reward_tiers_tier",
      "participants_campaigns_campaigns",
      "participants_business_campaigns_business_campaigns",
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

    await this.adminRepository.query("SET session_replication_role = DEFAULT;");
  }
}
