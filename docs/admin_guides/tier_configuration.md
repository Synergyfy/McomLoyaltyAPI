# Tier Configuration & Capabilities Guide

This document explains how to create and configure **Subscription Tiers** using the new flexible capability system. This system allows Admins to define granular permissions, quotas, and feature flags for each subscription level via a JSON configuration.

## Overview

Each `SubscriptionTier` now includes a `configuration` field. This field is a JSON object that strictly defines what a business on this tier can and cannot do.

The configuration controls three main areas:
1.  **Quotas**: Numeric limits (e.g., Max active campaigns).
2.  **Feature Flags**: Boolean toggles for specific features (e.g., Access to CRM).
3.  **Progress Bonuses**: Dynamic limit increases based on the business's progression level (e.g., "Active" or "Trusted" status).

Additionally, tiers can now support **Seasonal Variants** (Winter, Summer, Autumn, Spring), allowing for specific configurations and pricing for different seasons.

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
    "canUpdateReward": boolean
  },
  "progressBonuses": {
    // Optional: Add bonus quotas based on progression level
    "active_campaign_bonus": number,
    "trusted_campaign_bonus": number
  },
  
  // Seasonal Variants (Optional)
  "winter": {
    "price": number,
    "stripe_price_id": string,
    "paypal_plan_id": string,
    "quotas": { ... },          // Optional overrides
    "featureFlags": { ... },    // Optional overrides
    "progressBonuses": { ... }  // Optional overrides
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

#### 3. Progress Bonuses (Optional)
This section allows you to reward businesses for climbing the "Business Progression" ladder (Starter -> Active -> Trusted -> Partner).

*   **Key Format**: `[level_name]_campaign_bonus` (lowercase, spaces replaced by underscores).
*   **Value**: The *additional* number of campaigns allowed on top of the base quota.

**Example**:
If `maxActiveCampaigns` is `5`, and you set `"trusted_campaign_bonus": 2`:
*   A "Starter" business gets **5** campaigns.
*   A "Trusted" business gets **5 + 2 = 7** campaigns.

#### 4. Seasonal Variants (Optional)
You can define overrides for specific seasons: **Winter**, **Summer**, **Autumn**, and **Spring**.
Each seasonal variant object (`winter`, `summer`, etc.) can contain:

*   **price**: The specific price for this seasonal variant.
*   **stripe_price_id**: The Stripe Price ID for this seasonal variant.
*   **paypal_plan_id**: The PayPal Plan ID for this seasonal variant.
*   **quotas / featureFlags / progressBonuses**: Partial configuration objects. Any values defined here will **override** the base configuration for users with that seasonal variant.

---

## API Usage Examples

### 1. Creating a "Bronze" Tier (Restricted)
This tier is for entry-level businesses. They have low limits and cannot create custom campaigns.

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
      "canUpdateReward": false
    },
    "progressBonuses": {
      "active_campaign_bonus": 1
    }
  }
}
```

### 2. Creating a "Gold" Tier with Seasonal Variants
This tier offers high limits, but allows for specific seasonal configurations (e.g., a "Winter Special" with higher allowances).

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
      "canUpdateReward": true
    },
    "winter": {
        "price": 149.99,
        "stripe_price_id": "price_gold_winter_special",
        "quotas": {
            "maxActiveCampaigns": -1, // Unlimited for Winter
            "monthlyPointsAllowance": 10000
        }
    },
    "summer": {
        "price": 89.99,
        "stripe_price_id": "price_gold_summer_sale",
        "quotas": {
             "maxActiveCampaigns": 60
        }
    }
  }
}
```

### 3. Updating a Tier Configuration
You can modify the configuration of an existing tier at any time. The changes take effect immediately for all users on that tier.

**Endpoint**: `PATCH /tiers/:id`

**Payload**:
```json
{
  "configuration": {
    "quotas": {
      "maxActiveCampaigns": 10,  // Increased from 5
      "maxActiveRewards": 20,
      "maxRewardsPerCampaign": 2,
      "monthlyPointsAllowance": 1000,
      "maxTeamMembers": 3
    },
    "featureFlags": {
      "canCreateCampaignFromScratch": true, // Now allowed
      "canEditAdminTemplates": false,
      "hasAccessToAdvancedAnalytics": false,
      "hasAccessToCRM": false,
      "canUpdateReward": true
    }
  }
}
```

---

## How Enforcement Works

The system calculates the **Effective Limit** dynamically whenever a user attempts an action (like creating a campaign).

1.  **Check Variant**: If the user has a seasonal variant (e.g., `winter`), the system merges the specific seasonal configuration on top of the base configuration.
2.  **Apply Bonuses**: The system adds any applicable progress bonuses to the quotas.

**Formula**:
> `Effective Limit` = (`Tier Base Limit` OR `Seasonal Variant Limit`) + `Progress Level Bonus`

**Scenario**:
*   **Tier**: Gold (Base Limit: 50)
*   **Variant**: Winter (Limit Override: Unlimited/-1)
*   **User Level**: Active (Bonus: +5)
*   **Result**: The user has **Unlimited** campaigns.

If the user tries to exceed their effective limit, the API will return a `403 Forbidden` error with a message explaining the limit.
