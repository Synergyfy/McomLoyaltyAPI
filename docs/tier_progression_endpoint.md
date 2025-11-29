# Update Tier Progression Endpoint

## Overview
This endpoint allows administrators to update the progression configuration for a specific tier. It is used to define the conditions and benefits for "Pro" and "Pro Plus" levels within a tier.

- **URL**: `/tiers/:id/progression`
- **Method**: `PATCH`
- **Auth Required**: Yes (Bearer Token)
- **Roles**: Admin

## Request Parameters

| Parameter | Type   | Location | Description |
|-----------|--------|----------|-------------|
| `id`      | string | Path     | The UUID of the tier to update. |

## Request Body

The request body should follow the `UpdateTierProgressionDto` structure. It allows updating the `pro` and `pro_plus` configurations.

```typescript
{
  "pro": {
    "conditions": {
      // Criteria to reach this level
      "minCampaignsCreated": number,
      "minRewardsCreated": number,
      "minPointsUsed": number,
      "minCustomerScans": number,
      "minParticipants": number,
      "minTasksCompleted": number,
      "minPurchases": number,
      "minDaysActive": number,
      "profileCompleted": boolean,
      "kycVerified": boolean,
      "minCustomerInteractions": number,
      "minReviews": number,
      "minRedeemedRewards": number,
      "minRevenue": number
    },
    "benefits": {
      // Benefits granted at this level
      "quotas": {
        "maxActiveCampaigns": number,
        "maxActiveRewards": number,
        "maxRewardsPerCampaign": number,
        "monthlyPointsAllowance": number,
        "maxTeamMembers": number
      },
      "featureFlags": {
        "canCreateCampaignFromScratch": boolean,
        "canEditAdminTemplates": boolean,
        "hasAccessToAdvancedAnalytics": boolean,
        "hasAccessToCRM": boolean,
        "canUpdateReward": boolean
      },
      "bonusPoints": number,
      "unlockNextTierPreview": {
        "percentNextTierPoints": number,
        "additionalTeamMembers": number,
        "analytics": boolean,
        "segmentation": boolean
      }
    }
  },
  "pro_plus": {
    // Same structure as "pro"
  }
}
```

### Fields Description

- **`pro`**: Configuration for the "Pro" progression level.
- **`pro_plus`**: Configuration for the "Pro Plus" progression level.
- **`conditions`**: A set of criteria that a business must meet to achieve this level. All specified conditions must be met.
- **`benefits`**: The additional quotas, features, and bonuses granted when this level is achieved. These override or supplement the base tier configuration.

## Response

### Success (200 OK)
Returns the updated `Tier` object, including the new configuration.

```json
{
  "id": "tier-uuid",
  "name": "Bronze",
  "configuration": {
    "quotas": { ... },
    "featureFlags": { ... },
    "pro": {
      "conditions": { ... },
      "benefits": { ... }
    },
    "pro_plus": { ... }
  },
  ...
}
```

### Errors
- **403 Forbidden**: User is not an Admin.
- **404 Not Found**: Tier with the specified `id` does not exist.

## Implementation Details

The logic is handled in `TierService.updateProgression`:

1.  **Fetch Tier**: Retrieves the tier by `id`. Throws `NotFoundException` if not found.
2.  **Merge Configuration**: It performs a shallow merge of the existing tier configuration with the new progression data.
    ```typescript
    tier.configuration = {
      ...tier.configuration,
      ...progressionDto
    };
    ```
    *Note: This means providing `pro` will replace the entire existing `pro` object in the configuration, not merge deep properties inside `pro`.*
3.  **Save**: Persists the updated tier to the database.
4.  **History**: Creates a `TierHistory` record to track the change.

## Example Usage

**Request:**
`PATCH /tiers/123e4567-e89b-12d3-a456-426614174000/progression`

**Body:**
```json
{
  "pro": {
    "conditions": {
      "minCampaignsCreated": 5,
      "minCustomerScans": 100
    },
    "benefits": {
      "quotas": {
        "maxActiveCampaigns": 5
      },
      "bonusPoints": 500
    }
  }
}
```
