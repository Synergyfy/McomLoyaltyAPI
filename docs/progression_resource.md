# Progression Resource Documentation

The Progression resource manages the tiered loyalty system for both Businesses (Levels) and Customers (Badges). It handles automatic progression based on activity (points, campaigns created/joined) and provides admin capabilities for configuration and manual overrides.

Base URL: `/api/v1/progression`

---

## Data Structures (DTOs & Entities)

### 1. Business Level
Defines a tier for a Business (e.g., "Starter", "Partner").

**Entity Interface (`BusinessLevel`)**
```typescript
interface BusinessLevel {
  id: string;
  name: string;             // Unique name (e.g., "Gold")
  minPoints: number;        // Minimum reputation points required
  maxPoints: number | null; // Maximum points (null for highest tier)
  minCampaigns: number;     // Minimum campaigns created required
  maxCampaigns: number | null;
  privileges: string[];     // Array of privilege strings
  description: string;
  created_at: string;
  updated_at: string;
}
```

**Create/Update DTO (`CreateBusinessLevelDto`, `UpdateBusinessLevelDto`)**
```typescript
class CreateBusinessLevelDto {
  name: string;
  minPoints: number;      // Default: 0
  maxPoints?: number;     // Optional
  minCampaigns: number;   // Default: 0
  maxCampaigns?: number;  // Optional
  privileges?: string[];  // Optional, e.g., ["Priority Support"]
  description?: string;   // Optional
}
```

### 2. Customer Badge
Defines a tier for a Participant (e.g., "Bronze", "Platinum").

**Entity Interface (`CustomerBadge`)**
```typescript
interface CustomerBadge {
  id: string;
  name: string;                  // Unique name
  minPoints: number;             // Minimum global points required
  maxPoints: number | null;
  minCampaignsJoined: number;    // Minimum campaigns joined required
  maxCampaignsJoined: number | null;
  privileges: string[];
  description: string;
  created_at: string;
  updated_at: string;
}
```

**Create/Update DTO (`CreateCustomerBadgeDto`, `UpdateCustomerBadgeDto`)**
```typescript
class CreateCustomerBadgeDto {
  name: string;
  minPoints: number;             // Default: 0
  maxPoints?: number;            // Optional
  minCampaignsJoined: number;    // Default: 0
  maxCampaignsJoined?: number;   // Optional
  privileges?: string[];         // Optional
  description?: string;          // Optional
}
```

### 3. Progression Status
Represents the current state of a Business or Customer.

**Business Progression (`BusinessProgression`)**
```typescript
interface BusinessProgression {
  id: string;
  businessId: string;
  currentLevel: BusinessLevel;
  currentPoints: number;
  totalCampaignsCreated: number;
  isManualOverride: boolean; // If true, auto-progression is disabled
  updated_at: string;
}
```

**Customer Progression (`CustomerProgression`)**
```typescript
interface CustomerProgression {
  id: string;
  participantId: string;
  currentBadge: CustomerBadge;
  currentPoints: number;
  totalCampaignsJoined: number;
  isManualOverride: boolean; // If true, auto-progression is disabled
  updated_at: string;
}
```

---

## Endpoints

### Public / General Access

#### Get All Business Levels
Returns the list of configured business levels, ordered by `minPoints`.
- **Endpoint:** `GET /progression/levels`
- **Response:** `BusinessLevel[]`

#### Get All Customer Badges
Returns the list of configured customer badges, ordered by `minPoints`.
- **Endpoint:** `GET /progression/badges`
- **Response:** `CustomerBadge[]`

#### Get Business Progression
Gets the current status of a specific business. Triggers an automatic check/update logic to ensure the level matches current stats (unless overridden).
- **Endpoint:** `GET /progression/business/:id`
- **Params:** `id` (Business UUID)
- **Response:** `BusinessProgression`

#### Get Customer Progression
Gets the current status of a specific participant. Triggers an automatic check/update logic.
- **Endpoint:** `GET /progression/customer/:id`
- **Params:** `id` (Participant UUID)
- **Response:** `CustomerProgression`

---

### History

#### Get Business History
Returns the log of level changes for a business.
- **Endpoint:** `GET /progression/history/business/:id`
- **Response:** `ProgressionHistory[]`

#### Get Customer History
Returns the log of badge changes for a participant.
- **Endpoint:** `GET /progression/history/customer/:id`
- **Response:** `ProgressionHistory[]`

---

### Admin Configuration (Protected)

#### Create Business Level
- **Endpoint:** `POST /progression/admin/levels`
- **Body:** `CreateBusinessLevelDto`
- **Response:** `BusinessLevel`

#### Update Business Level
- **Endpoint:** `PUT /progression/admin/levels/:id`
- **Params:** `id` (Level UUID)
- **Body:** `UpdateBusinessLevelDto` (Partial of Create DTO)
- **Response:** `BusinessLevel` (Updated)

#### Create Customer Badge
- **Endpoint:** `POST /progression/admin/badges`
- **Body:** `CreateCustomerBadgeDto`
- **Response:** `CustomerBadge`

#### Update Customer Badge
- **Endpoint:** `PUT /progression/admin/badges/:id`
- **Params:** `id` (Badge UUID)
- **Body:** `UpdateCustomerBadgeDto` (Partial of Create DTO)
- **Response:** `CustomerBadge` (Updated)

---

### Admin Overrides (Protected)

These endpoints allow an admin to manually set a user's tier. This sets the `isManualOverride` flag to `true`, preventing future automatic upgrades/downgrades based on points.

#### Override Business Tier
- **Endpoint:** `POST /progression/admin/override/business`
- **Body:**
  ```typescript
  {
    businessId: string; // UUID of the business
    levelId: string;    // UUID of the target level
    adminId: string;    // UUID of the admin performing the action (for logs)
  }
  ```
- **Response:** `BusinessProgression`

#### Override Customer Badge
- **Endpoint:** `POST /progression/admin/override/customer`
- **Body:**
  ```typescript
  {
    participantId: string; // UUID of the participant
    badgeId: string;       // UUID of the target badge
    adminId: string;       // UUID of the admin performing the action
  }
  ```
- **Response:** `CustomerProgression`
