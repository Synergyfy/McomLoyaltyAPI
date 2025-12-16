# Stamp System - Developer Documentation

This document outlines the implementation of the Stamp Reward System in the backend.

## 1. Overview

The Stamp System allows:
- **Admins** to create and manage `StampRewardTemplates`.
- **Businesses** to activate templates, creating `BusinessStampRewards`.
- **Participants** (Customers) to collect stamps via `StampCards` and earn rewards.
- **Hybrid Logic**: Optionally award points alongside stamps.

## 2. Entities

All entities are located in `src/resources/stamp/entities/`.

### 2.1. StampRewardTemplate
Defined by Admin.
- `title`, `description`
- `required_stamps`
- `reward_benefit` (Enum: FREE_ITEM, DISCOUNT, etc.)
- `trigger_method` (Enum: QR_SCAN, PURCHASE, CHECK_IN)
- `is_hybrid`: If true, points are awarded per stamp.

### 2.2. BusinessStampReward
Activated instance of a template for a specific Business.
- Links to `StampRewardTemplate` and `Business`.
- `total_enrolled`, `total_completions`, `total_redemptions`: Cached counters for analytics.

### 2.3. StampCard
Tracks a participant's progress for a specific reward.
- `current_stamps`
- `status` (IN_PROGRESS, COMPLETED, REDEEMED)

### 2.4. StampEvent
Log of every stamp addition.
- `trigger_method`
- `points_added` (if hybrid)

## 3. API Endpoints

### 3.1. Admin Endpoints (`/admin/stamps`)
- `POST /admin/stamps/templates`: Create a new template.
- `GET /admin/stamps/templates`: List all templates.
- `GET /admin/stamps/templates/:id`: Get template details.
- `PATCH /admin/stamps/templates/:id`: Update template.
- `POST /admin/stamps/templates/:id/publish`: Publish template.

### 3.2. Business Endpoints (`/business/stamps`)
- `GET /business/stamps/templates`: List published templates available for activation.
- `POST /business/stamps/activate`: Activate a template.
    - Payload: `{ templateId: string, custom_image?: string, operating_hours?: string }`
- `GET /business/stamps/active`: List active rewards for the logged-in business.
- `GET /business/stamps/stats`: Get simplified stats for rewards.
- `POST /business/stamps/scan`: Add a stamp by scanning participant QR.
    - Payload: `{ participantUniqueCode: string, businessStampRewardId: string }`
- `POST /business/stamps/redeem`: Redeem a completed card.
    - Payload: `{ participantUniqueCode: string }`

### 3.3. Participant Endpoints (`/participant/stamps`)
- `GET /participant/stamps/my-cards`: List all stamp cards (active and past).
- `GET /participant/stamps/card/:id`: Get detailed view of a card.

## 4. Key Logic & Flows

### 4.1. Adding a Stamp
1. Business calls `/business/stamps/scan` with `participantUniqueCode`.
2. System verifies:
   - Business owns the reward.
   - Reward is active.
   - Trigger method is valid.
3. System finds or creates a `StampCard` (IN_PROGRESS).
4. Increments `current_stamps`.
5. If `current_stamps >= required_stamps`, marks status as `COMPLETED`.
6. If Hybrid Mode is enabled:
   - Adds `hybrid_points_per_stamp` to `Participant.global_total_points`.
   - If completed, adds `hybrid_completion_bonus_points`.
7. Logs `StampEvent`.

### 4.2. Redeeming a Reward
1. Business calls `/business/stamps/redeem` with `participantUniqueCode`.
2. System finds a `COMPLETED` card for that participant and business.
3. Marks status as `REDEEMED`.
4. Automatically creates a new empty `StampCard` for the user (repeatable flow).
5. Updates analytics counters.

## 5. Security & Validation
- **RolesGuard**: Ensures only authorized roles access specific endpoints.
- **Ownership Checks**: Participants can only view their own cards. Businesses can only modify their own rewards.
- **Transactional Consistency**: Stamp addition and Point updates occur within a database transaction.
