# Business Campaign Creation Guide

This document outlines the process for business owners to create campaigns using the McomLoyaltyAPI.

## Endpoint

**POST** `/campaigns`

This endpoint allows business owners to create a new campaign from scratch.

## Payload

The request body should be a JSON object conforming to the `CreateCampaignDto` interface.

### Interface

```typescript
interface CreateCampaignDto {
  // --- Basic Information ---
  name: string;
  campaign_type: CampaignType;
  campaign_message: string;
  
  // --- Timing & Quantity ---
  start_date: Date; // ISO 8601 format string
  end_date: Date;   // ISO 8601 format string
  quantity: number; // Total number of participants/rewards available? (Depends on business logic)

  // --- Audience ---
  audience_type: AudienceType;
  
  // --- Design & Branding ---
  banner_url: string; // URL
  logo_url?: string;  // URL (Optional)
  
  cta_text: string;
  cta_background_color: string; // Hex color code (e.g., "#FFFFFF")
  cta_text_color: string;       // Hex color code
  text_color: string;           // Hex color code
  background_color: string;     // Hex color code

  // --- Points & Rewards Configuration ---
  signUpPoint?: number; // Points awarded upon sign up (Optional)
  
  reward_type?: RewardType; // Default: RewardType.REGULAR
  regular_points_threshold?: number;
  matching_points_threshold?: number;

  // --- Page Customization (Optional) ---
  earn_point_page_title?: string;
  earn_point_page_description?: string;
  
  redeem_reward_page_title?: string;
  redeem_reward_page_description?: string;
  
  contact_us_page_title?: string;
  contact_us_page_description?: string;
  
  contact_email?: string;
  contact_phone_number?: string;
  footer_text?: string;

  // --- Rewards Linking ---
  /**
   * The IDs of the business rewards attached to the campaign.
   * These rewards must belong to the creating business.
   */
  business_reward_ids: string[]; 
}
```

### Enums

#### CampaignType
```typescript
enum CampaignType {
  QR_CODE = 'qr_code',
  REFERRAL = 'referral',
  SOCIAL_OR_EMAIL = 'social_or_email',
  SPECIAL_OCCASION = 'special_occasion',
}
```

#### AudienceType
```typescript
enum AudienceType {
  MEMBERS = 'members',
  BADGE_LEVEL = 'badge_level',
  TARGET_WISHLIST = 'target_wishlist',
}
```

#### RewardType
```typescript
enum RewardType {
  REGULAR = 'regular',
  MATCHING = 'matching',
  BOTH = 'both',
}
```

## Response

The API returns a `BusinessCampaign` object upon successful creation.

### Interface

```typescript
interface BusinessCampaign {
  id: string; // UUID
  uniqueCode: string; // 9-character unique code
  
  // --- Relations ---
  business: Business; // The business owner
  campaign?: Campaign; // Null for campaigns created from scratch
  businessRewards: BusinessReward[]; // The linked business rewards
  rewards: Reward[]; // Admin rewards (usually empty for custom campaigns)
  
  // --- Copied/Set Fields ---
  name: string;
  campaign_type: CampaignType;
  campaign_message: string;
  start_date: Date;
  end_date: Date;
  quantity: number;
  audience_type: AudienceType;
  banner_url: string;
  logo_url: string;
  cta_text: string;
  cta_background_color: string;
  cta_text_color: string;
  text_color: string;
  background_color: string;
  
  signUpPoint: number;
  reward_type: RewardType;
  regular_points_threshold: number;
  matching_points_threshold: number;
  
  // --- Statistics & Status ---
  total_points_earned: number;
  total_points_redeemed: number;
  total_matching_points_earned: number;
  matching_points_disabled_by_admin: boolean;
  disabled: boolean;
  
  // --- Page Details ---
  earn_point_page_title: string;
  earn_point_page_description: string;
  redeem_reward_page_title: string;
  redeem_reward_page_description: string;
  contact_us_page_title: string;
  contact_us_page_description: string;
  contact_email: string;
  contact_phone_number: string;
  footer_text: string;
  
  // --- Timestamps ---
  created_at: Date;
  updated_at: Date;
}
```

## Example Request

```json
{
  "name": "Summer Sale 2024",
  "campaign_type": "qr_code",
  "campaign_message": "Scan to win points!",
  "start_date": "2024-06-01T00:00:00Z",
  "end_date": "2024-08-31T23:59:59Z",
  "quantity": 1000,
  "audience_type": "members",
  "banner_url": "https://example.com/banner.jpg",
  "cta_text": "Join Now",
  "cta_background_color": "#FF5733",
  "cta_text_color": "#FFFFFF",
  "text_color": "#000000",
  "background_color": "#F0F0F0",
  "business_reward_ids": [
    "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "f1e2d3c4-b5a6-0987-6543-210987fedcba"
  ]
}

## Updating a Campaign

**PATCH** `/business/campaigns/:id`

This endpoint allows business owners to update an existing campaign.

### Payload

The request body should be a JSON object conforming to the `UpdateCampaignDto` interface. This is a partial version of `CreateCampaignDto`, meaning all fields are optional.

### Interface

```typescript
interface UpdateCampaignDto extends Partial<CreateCampaignDto> {
  // --- Rewards Linking (Specific Rules Apply) ---
  
  /**
   * The IDs of the admin rewards attached to the campaign.
   * ONLY allowed for "Claimed" campaigns (created from an Admin Template).
   */
  reward_ids?: string[]; 

  /**
   * The IDs of the business rewards attached to the campaign.
   * ONLY allowed for "Custom" campaigns (created from scratch).
   */
  business_reward_ids?: string[];
}
```

### Important Rules for Updating Rewards

1.  **Claimed Campaigns (Templates)**:
    *   If you are updating a campaign that was claimed from an Admin Template, you **MUST** use `reward_ids` to link Admin Rewards.
    *   You are **NOT** allowed to use `business_reward_ids`.
    *   *Note: Updating claimed campaigns requires specific permissions.*

2.  **Custom Campaigns (From Scratch)**:
    *   If you are updating a campaign created from scratch, you **MUST** use `business_reward_ids` to link your Business Rewards.
    *   You are **NOT** allowed to use `reward_ids`.

3.  **Exclusivity**: A campaign cannot have both Admin Rewards and Business Rewards.
4.  **Minimum Requirement**: A campaign must always have at least one reward linked.

### Example Request (Update Custom Campaign)

```json
{
  "name": "Extended Summer Sale",
  "end_date": "2024-09-15T23:59:59Z",
  "business_reward_ids": [
    "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  ]
}
```
```
