# Tier Configuration & Capabilities Guide

This document explains how to create and configure **Subscription Tiers** using the new flexible capability system. This system allows Admins to define granular permissions, quotas, and feature flags for each subscription level via a JSON configuration.

## Overview

Each `SubscriptionTier` now includes a `configuration` field. This field is a JSON object that strictly defines what a business on this tier can and cannot do.

The configuration controls four main areas:
1.  **Quotas**: Numeric limits (e.g., Max active campaigns).
2.  **Feature Flags**: Boolean toggles for specific features (e.g., Access to CRM).
3.  **Progress Bonuses**: Dynamic limit increases based on the business's progression level (e.g., "Active" or "Trusted" status).
4.  **Progression Levels (Pro/ProPlus)**: Non-paid upgrades unlocked by meeting specific conditions.

Additionally, tiers can support **Seasonal Variants** (Winter, Summer, Autumn, Spring), allowing for specific configurations and pricing for different seasons.

---

## The Configuration Object

The `configuration` JSON object must adhere to the following structure:

```json
{
  "quotas": {
    "maxActiveCampaigns": number,       // -1 for unlimited
    "maxActiveRewards": number,         // -1 for unlimited
    "maxRewardsPerCampaign": number,
    "monthlyPointsAllowance": number,
    "maxTeamMembers": number            // -1 for unlimited
  },
  "featureFlags": {
    "canCreateCampaignFromScratch": boolean,
    "canEditAdminTemplates": boolean,
    "hasAccessToAdvancedAnalytics": boolean,
    "hasAccessToCRM": boolean,
    "canUpdateReward": boolean,
    "canCreateRewardFromScratch": boolean
  },
  "progressBonuses": {
    // Optional: Add bonus quotas based on progression level
    "active_campaign_bonus": number,
    "trusted_campaign_bonus": number
  },
  
  // Progression Levels (Optional)
  "pro": {
      "conditions": { ... }, // Triggers to unlock Pro
      "benefits": { ... }    // Benefits unlocked at Pro
  },
  "pro_plus": {
      "conditions": { ... }, // Triggers to unlock ProPlus
      "benefits": { ... }    // Benefits unlocked at ProPlus
  },

  // Seasonal Variants (Optional)
  "winter": {
    "price": number,
    "stripe_price_id": string,
    "paypal_plan_id": string,
    "quotas": { ... },          // Optional overrides
    "featureFlags": { ... },    // Optional overrides
    "progressBonuses": { ... }, // Optional overrides
    "pro": { ... },             // Optional overrides for Pro in Winter
    "pro_plus": { ... }         // Optional overrides for ProPlus in Winter
  },
  "summer": { ... },
  "autumn": { ... },
  "spring": { ... }
}
```

### Field Definitions

#### 1. Quotas
| Field | Type | Description |
| :--- | :--- | :--- |
| `maxActiveCampaigns` | `number` | The maximum number of campaigns a business can have active simultaneously. Set to `-1` for unlimited. |
| `maxActiveRewards` | `number` | The maximum number of active rewards a business can have. Set to `-1` for unlimited. |
| `maxRewardsPerCampaign` | `number` | The maximum number of rewards that can be attached to a single campaign. |
| `monthlyPointsAllowance` | `number` | The amount of system points credited to the business each month (if applicable). |
| `maxTeamMembers` | `number` | The maximum number of team members (staff) a business can have. Set to `-1` for unlimited. |

#### 2. Feature Flags
| Field | Type | Description |
| :--- | :--- | :--- |
| `canCreateCampaignFromScratch` | `boolean` | If `true`, the business can create custom campaigns. If `false`, they must use Admin-created templates. |
| `canEditAdminTemplates` | `boolean` | If `true`, the business can modify the details of a template. If `false`, the template is read-only. |
| `hasAccessToAdvancedAnalytics` | `boolean` | Grants access to detailed analytics dashboards. |
| `hasAccessToCRM` | `boolean` | Grants access to Customer Relationship Management features. |
| `canUpdateReward` | `boolean` | If `true`, the business can edit their existing rewards. |
| `canCreateRewardFromScratch` | `boolean` | If `true`, the business can create custom rewards. If `false`, they must use Admin-created templates. |

#### 3. Progression Levels (Pro & ProPlus)
This system allows businesses to unlock better features **without paying extra**, simply by being active and meeting conditions.

**Structure**:
Each level (`pro` and `pro_plus`) has two parts:
1.  **Conditions**: What the business must achieve to unlock this level.
2.  **Benefits**: What the business gets when they unlock this level.

**Conditions Object**:
| Field | Type | Description |
| :--- | :--- | :--- |
| `minCampaignsCreated` | `number` | Minimum total campaigns created. |
| `minRewardsCreated` | `number` | Minimum total rewards created. |
| `minPointsUsed` | `number` | Minimum total points distributed/redeemed. |
| `minCustomerScans` | `number` | Minimum number of QR/NFC scans received. |
| `minParticipants` | `number` | Minimum number of unique participants engaged. |
| `minCustomerInteractions` | `number` | Total interactions (scans + redemptions). |
| `minDaysActive` | `number` | Days since registration. |
| `profileCompleted` | `boolean` | Whether the business profile is fully filled. |
| `kycVerified` | `boolean` | Whether KYC documents are verified. |

**Benefits Object**:
| Field | Type | Description |
| :--- | :--- | :--- |
| `quotas` | `Partial<TierQuotas>` | Overrides for base quotas (e.g., higher campaign limit). |
| `featureFlags` | `Partial<TierFeatureFlags>` | Overrides for feature flags (e.g., unlock CRM). |
| `bonusPoints` | `number` | One-time or monthly bonus points added to allowance. |
| `unlockNextTierPreview` | `object` | Special preview features of the *next* paid tier (e.g., `percentNextTierPoints`, `additionalTeamMembers`). |

#### 4. Seasonal Variants (Optional)
You can define overrides for specific seasons: **Winter**, **Summer**, **Autumn**, and **Spring**.
Each seasonal variant object (`winter`, `summer`, etc.) can contain:

*   **price**: The specific price for this seasonal variant.
*   **stripe_price_id**: The Stripe Price ID for this seasonal variant.
*   **paypal_plan_id**: The PayPal Plan ID for this seasonal variant.
*   **quotas / featureFlags / progressBonuses**: Partial configuration objects. Any values defined here will **override** the base configuration for users with that seasonal variant.
*   **pro / pro_plus**: Specific progression rules for this season.

#### 5. Trial Configuration
You can define specific access control for users who are on a trial period. This configuration takes precedence over the base and seasonal configurations when a user is in trial mode.

*   `quotas`: Overrides for base quotas.
*   `featureFlags`: Overrides for feature flags.
*   `progressBonuses`: Overrides for bonus points.

```json
"trial": {
    "quotas": {
        "maxActiveCampaigns": 2,
        "monthlyPointsAllowance": 100
    },
    "featureFlags": {
        "hasAccessToCRM": false
    }
}
```

---

## API Usage Examples

### 1. Creating a "Bronze" Tier with Progression
This tier starts restricted but unlocks features as the business grows.

**Endpoint**: `POST /tiers`

**Payload**:
```json
{
  "name": "Bronze",
  "monthly_price": 29.99,
  "annual_price": 300.00,
  "quaterly_price": 85.00,
  "features": ["Basic Analytics", "5 Active Campaigns"],
  "status": "published",
  "configuration": {
    "quotas": {
      "maxActiveCampaigns": 5,
      "maxActiveRewards": 10,
      "maxRewardsPerCampaign": 1,
      "monthlyPointsAllowance": 500,
      "maxTeamMembers": 1
    },
    "featureFlags": {
      "canCreateCampaignFromScratch": false,
      "canEditAdminTemplates": false,
      "hasAccessToAdvancedAnalytics": false,
      "hasAccessToCRM": false,
      "canUpdateReward": false,
      "canCreateRewardFromScratch": false
    },
    "pro": {
        "conditions": {
            "minCampaignsCreated": 2,
            "minPointsUsed": 500
        },
        "benefits": {
            "quotas": {
                "maxActiveCampaigns": 7,
                "maxRewardsPerCampaign": 2
            },
            "featureFlags": {
                "canEditAdminTemplates": true
            },
            "bonusPoints": 200
        }
    },
    "pro_plus": {
        "conditions": {
            "minCampaignsCreated": 5,
            "minCustomerInteractions": 100
        },
        "benefits": {
            "quotas": {
                "maxActiveCampaigns": 10,
                "maxTeamMembers": 2
            },
            "featureFlags": {
                "canCreateCampaignFromScratch": true
            },
            "unlockNextTierPreview": {
                "percentNextTierPoints": 10
            }
        }
    }
  }
}
```

### 2. Creating a "Gold" Tier with Seasonal Variants & Progression
This tier offers high limits, seasonal pricing, and progression rewards.

**Endpoint**: `POST /tiers`

**Payload**:
```json
{
  "name": "Gold",
  "monthly_price": 99.99,
  "annual_price": 1000.00,
  "quaterly_price": 280.00,
  "features": ["CRM Access", "Unlimited Campaigns", "Advanced Analytics"],
  "status": "published",
  "configuration": {
    "quotas": {
      "maxActiveCampaigns": 50,
      "maxActiveRewards": 100,
      "maxRewardsPerCampaign": 5,
      "monthlyPointsAllowance": 5000,
      "maxTeamMembers": 5
    },
    "featureFlags": {
      "canCreateCampaignFromScratch": true,
      "canEditAdminTemplates": true,
      "hasAccessToAdvancedAnalytics": true,
      "hasAccessToCRM": true,
      "canUpdateReward": true,
      "canCreateRewardFromScratch": true
    },
    "winter": {
        "price": 149.99,
        "stripe_price_id": "price_gold_winter_special",
        "quotas": {
            "maxActiveCampaigns": -1, // Unlimited for Winter
            "monthlyPointsAllowance": 10000
        },
        "pro": {
            "conditions": { "minCampaignsCreated": 10 },
            "benefits": { "quotas": { "maxTeamMembers": 10 } }
        }
    }
  }
}
```

---

## How Enforcement Works

The system calculates the **Effective Limit** dynamically whenever a user attempts an action (like creating a campaign).

1.  **Base Config**: Start with the Tier's base configuration.
2.  **Seasonal Override**: If the user has a seasonal variant (e.g., `winter`), merge the specific seasonal configuration.
3.  **Progression Override**: If the user has reached `pro` or `pro_plus` level, merge the corresponding `benefits` configuration.
    *   *Note*: Seasonal progression rules take precedence over base progression rules if defined.
4.  **Trial Override**: If the user is on a **Trial** membership, merge the `trial` configuration. This overrides all other settings to ensure strict limits for trial users.

**Formula**:
> `Effective Limit` = (`Base` + `Seasonal Override` + `Progression Benefits` + `Trial Override`) + `Progress Level Bonus`

**Scenario**:
*   **Tier**: Bronze (Base Limit: 5)
*   **Progression**: Pro (Benefit: +2 Campaigns -> Limit: 7)
*   **User Level**: Active (Bonus: +1)
*   **Result**: The user has **8** campaigns allowed.

If the user tries to exceed their effective limit, the API will return a `403 Forbidden` error with a message explaining the limit.
