# Stamp System - Developer Documentation

This document outlines the implementation of the Stamp Reward System in the backend.

## 1. Overview

The Stamp System allows:
- **Admins** to create and manage `StampRewardTemplates`.
- **Businesses** to activate templates, creating `BusinessStampRewards`.
- **Participants** (Customers) to collect stamps via `StampCards` and earn rewards.
- **Hybrid Logic**: Optionally award points alongside stamps.

## 2. API Endpoints

### 2.1 Admin Endpoints
Base URL: `/admin/stamps`
**Auth**: Admin Role Required.

#### `POST /admin/stamps/templates`
Creates a new Stamp Reward Template.

**Request Body (`CreateStampTemplateDto`):**
```typescript
interface CreateStampTemplateDto {
  title: string;                         // Required. Example: 'Buy 5 Get 1 Free'
  description: string;                   // Required. Example: 'Collect 5 stamps...'
  required_stamps: number;               // Required. Min: 1. Example: 5
  reward_benefit: StampRewardType;       // Required. Enum: FREE_ITEM, DISCOUNT, etc.
  reward_benefit_value?: string;         // Optional. Example: 'Coffee'
  trigger_method: StampTriggerMethod;    // Required. Enum: QR_SCAN, PURCHASE, CHECK_IN
  stamp_validity_days?: number;          // Optional.
  reward_claim_deadline_days?: number;   // Optional.
  is_hybrid?: boolean;                   // Optional. Default: false
  hybrid_points_per_stamp?: number;      // Optional. Default: 0
  hybrid_completion_bonus_points?: number; // Optional. Default: 0
  default_image?: string;                // Optional.
}
```

#### `GET /admin/stamps/templates`
List all Stamp Reward Templates (draft, published, and archived).

#### `GET /admin/stamps/templates/:id`
Get a specific template by ID.

#### `PATCH /admin/stamps/templates/:id`
Update a template.

#### `POST /admin/stamps/templates/:id/publish`
Publish a template so businesses can see and activate it.

#### `POST /admin/stamps/templates/:id/archive`
Archive a template (hides it from active lists).

#### `POST /admin/stamps/templates/:id/duplicate`
Duplicate an existing template.

#### `DELETE /admin/stamps/templates/:id`
Soft delete a template.

---

### 2.2 Business Endpoints
Base URL: `/business/stamps`
**Auth**: Business or Staff Role Required.

#### `GET /business/stamps/templates`
List published templates available for activation.

#### `POST /business/stamps/activate`
Activate a template for the business.

**Request Body (`ActivateStampRewardDto`):**
```typescript
interface ActivateStampRewardDto {
  templateId: string;        // Required. UUID of the template.
  custom_image?: string;     // Optional. Overrides default image.
  operating_hours?: string;  // Optional. e.g., "Mon-Fri 9-5"
}
```

#### `GET /business/stamps/active`
List active stamp rewards for the logged-in business.

#### `GET /business/stamps/active/:id/customers`
List customers (Stamp Cards) for a specific reward.

#### `POST /business/stamps/active/:id/pause`
Pause a reward program (prevents new earnings).

#### `POST /business/stamps/active/:id/resume`
Resume a paused reward program.

#### `DELETE /business/stamps/active/:id`
Deactivate (soft delete) a reward program.

#### `GET /business/stamps/stats`
Get simplified stats for active stamp rewards.

#### `POST /business/stamps/scan`
Scan a participant's QR code to add a stamp. Also supports manual add by customer ID.

**Request Body (`ScanParticipantQrDto`):**
```typescript
interface ScanParticipantQrDto {
  participantUniqueCode?: string;   // Optional (One required). User's 9-char code.
  customerId?: string;              // Optional (One required). User's UUID.
  businessStampRewardId: string;    // Required. UUID of the reward program.
}
```

#### `POST /business/stamps/redeem`
Redeem a completed stamp card for a participant.

**Request Body (`RedeemStampCardDto`):**
```typescript
interface RedeemStampCardDto {
  participantUniqueCode?: string; // Optional (One required).
  stampCardId?: string;           // Optional (One required).
}
```

---

### 2.3 Participant Endpoints
Base URL: `/participant/stamps`
**Auth**: Participant Role Required.

#### `GET /participant/stamps/discover`
Get all available active rewards from onboarded businesses.

#### `POST /participant/stamps/start`
Self-enroll in a stamp reward program (create initial card).

**Request Body (`StartStampCardDto`):**
```typescript
interface StartStampCardDto {
  businessStampRewardId: string; // Required.
}
```

#### `GET /participant/stamps/stats`
Get aggregated stats for the participant (Total cards, Completed, In Progress).

#### `GET /participant/stamps/my-cards`
List all stamp cards (active and past) for the logged-in user.

#### `GET /participant/stamps/card/:id`
Get detailed view of a specific stamp card.

#### `GET /participant/stamps/business/:businessId`
Get available stamp rewards for a specific business.

## 3. Enums

### `StampTriggerMethod`
- `QR_SCAN`
- `PURCHASE`
- `CHECK_IN`

### `StampRewardType`
- `FREE_ITEM`
- `DISCOUNT`
- `FREE_SERVICE`
- `BONUS_POINTS`

### `StampCardStatus`
- `IN_PROGRESS`
- `COMPLETED`
- `REDEEMED`
