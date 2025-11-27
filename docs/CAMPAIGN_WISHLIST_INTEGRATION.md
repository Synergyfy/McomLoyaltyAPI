
# Campaign & Wishlist Integration Strategy

This document outlines the strategy for integrating the new Wishlist module with the existing Campaign module.

## 1. Campaign Entity Modification

The existing `Campaign` entity needs to be modified to support targeting based on wishlist items.

### Add `targetingRule` to Campaign Entity

A new `targetingRule` enum field should be added to the `Campaign` entity.

```typescript
// src/resources/campaign/entities/campaign-enums.ts

export enum CampaignTargetingRule {
  GENERAL = 'GENERAL',
  WISHLIST_MATCH = 'WISHLIST_MATCH',
  // ... other potential targeting rules
}
```

```typescript
// src/resources/campaign/entities/campaign.entity.ts

// ... imports
import { CampaignTargetingRule } from './campaign-enums';

@Entity('campaigns')
export class Campaign extends AbstractBaseEntity {
  // ... existing fields

  @Column({
    type: 'enum',
    enum: CampaignTargetingRule,
    default: CampaignTargetingRule.GENERAL,
  })
  targetingRule: CampaignTargetingRule;

  @Column({ type: 'jsonb', nullable: true })
  targetingCriteria: {
    itemName?: string;
    categoryId?: string;
  };
}
```

When a business creates a campaign with `targetingRule` as `WISHLIST_MATCH`, the `targetingCriteria` field will store the specifics of what is being targeted (e.g., `{ "itemName": "Running Shoes" }`).

## 2. Background Job for Notification Logic

A background job is required to match active campaigns to wishlist items and send notifications to users. This job should be designed to be scalable and to avoid spamming users.

### Architecture

- **Queue:** A message queue (e.g., Redis with BullMQ) should be used to manage the notification tasks. This will ensure that notifications are processed asynchronously and reliably.
- **Cron Job:** A cron job (e.g., using `@nestjs/schedule`) will run periodically (e.g., once every hour) to trigger the matching process.

### The Flow

1.  **Cron Job Trigger:** The cron job runs and calls a `CampaignMatchingService`.
2.  **Fetch Campaigns:** The `CampaignMatchingService` fetches all active campaigns with `targetingRule` set to `WISHLIST_MATCH`.
3.  **Fetch Wishlist Items:** For each campaign, the service queries the `WishlistItem` entity for items that match the `targetingCriteria` and where `marketingConsent` is `true`.
4.  **Check Spam Limits:** Before sending a notification, the service must check a user's notification history (e.g., from a `NotificationLog` entity) to ensure they have not exceeded the monthly limit (e.g., max 3 wishlist-related notifications per month).
5.  **Enqueue Notifications:** If the spam limit is not exceeded, a notification job is added to the queue. The job data will include the `userId`, `campaignId`, and `wishlistItemId`.
6.  **Process Notifications:** A queue worker will process the notification jobs, sending an email or push notification to the user about the relevant campaign.
7.  **Log Notification:** After a notification is sent, a record is created in the `NotificationLog` to track the user's notification history.

This architecture ensures that the matching and notification process is decoupled from the main application flow, is resilient to failures, and respects the defined spam limits.
