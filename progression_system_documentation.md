# Progression System Documentation

## 1. Overview
The Progression System is a comprehensive module designed to manage and track the growth of both **Businesses** (via Tiers) and **Customers/Participants** (via Badges). It incentivizes engagement by automatically upgrading users to higher levels based on their activity (points earned and campaigns created/joined).

### Key Features
- **Dual Progression Tracks**: Separate logic for Businesses (Levels) and Customers (Badges).
- **Automatic Upgrades**: The system automatically checks criteria and promotes users.
- **No Demotion Policy**: Once a user achieves a level, they are not automatically downgraded, even if their stats drop.
- **Manual Overrides**: Administrators can manually assign specific levels, which locks the user to that level until further notice.
- **History Tracking**: All changes (automatic or manual) are logged for audit purposes.

---

## 2. Data Models & Entities

### 2.1. Business Level (`BusinessLevel`)
Defines the tiers available for businesses (e.g., Starter, Active, Trusted, Partner).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique identifier (UUID). |
| `name` | string | Name of the level (e.g., "Gold"). |
| `minPoints` | number | Minimum reputation points required. |
| `maxPoints` | number | Maximum points for this range (nullable for top tier). |
| `minCampaigns` | number | Minimum campaigns created required. |
| `maxCampaigns` | number | Maximum campaigns for this range. |
| `privileges` | string[] | Array of strings describing benefits (e.g., "Priority Support"). |
| `description` | string | User-facing description of the level. |

### 2.2. Customer Badge (`CustomerBadge`)
Defines the badges available for customers (e.g., Bronze, Silver, Gold, Platinum).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique identifier (UUID). |
| `name` | string | Name of the badge. |
| `minPoints` | number | Minimum global points required. |
| `minCampaignsJoined` | number | Minimum campaigns joined required. |
| `privileges` | string[] | Array of benefits. |
| `description` | string | User-facing description. |

### 2.3. Business Progression (`BusinessProgression`)
Tracks the *current* state of a specific business.

| Field | Type | Description |
| :--- | :--- | :--- |
| `businessId` | string | ID of the business. |
| `currentLevel` | BusinessLevel | Relation to the current active level. |
| `currentPoints` | number | Snapshot of points at last check. |
| `totalCampaignsCreated` | number | Snapshot of campaign count at last check. |
| `isManualOverride` | boolean | If `true`, automatic updates are disabled for this business. |

### 2.4. Customer Progression (`CustomerProgression`)
Tracks the *current* state of a specific customer.

| Field | Type | Description |
| :--- | :--- | :--- |
| `participantId` | string | ID of the participant. |
| `currentBadge` | CustomerBadge | Relation to the current active badge. |
| `currentPoints` | number | Snapshot of points at last check. |
| `totalCampaignsJoined` | number | Snapshot of campaign count at last check. |
| `isManualOverride` | boolean | If `true`, automatic updates are disabled for this customer. |

---

## 3. Business Logic

### 3.1. Progression Criteria
Progression is determined by two metrics:
1.  **Points**: `reputation_points` for Businesses, `global_total_points` for Customers.
2.  **Activity**: Number of campaigns created (Business) or joined (Customer).

**Rule**: To qualify for a level, a user must meet **BOTH** the minimum points and minimum activity requirements for that level.

### 3.2. Upgrade Only (No Demotion)
The system follows a strict **"Upgrade Only"** policy for automatic updates.
- When a user's stats are checked, the system calculates the highest level they qualify for.
- If this new level is **higher** than their current level, they are promoted.
- If the new level is **lower** (e.g., they lost points), they remain at their current level. They are **NOT** demoted.

### 3.3. Manual Overrides
- An administrator can manually assign a specific level/badge to a user.
- This action sets the `isManualOverride` flag to `true`.
- **Effect**: The system will skip all automatic progression checks for this user. They will remain at the assigned level indefinitely until an admin changes it or disables the override.

---

## 4. API Reference

### 4.1. Public/Shared Endpoints

#### Get All Business Levels
Retrieves the list of all defined business tiers and their criteria.
- **Endpoint**: `GET /progression/levels`
- **Access**: Public / Authenticated Users
- **Response**: `BusinessLevel[]`

#### Get All Customer Badges
Retrieves the list of all defined customer badges.
- **Endpoint**: `GET /progression/badges`
- **Access**: Public / Authenticated Users
- **Response**: `CustomerBadge[]`

#### Get Business Progression
Retrieves the current status of a business. **Triggers a check-and-update cycle.**
- **Endpoint**: `GET /progression/business/:id`
- **Access**: Business Owner, Admin
- **Response**: `BusinessProgression`
```json
{
  "id": "...",
  "businessId": "...",
  "currentPoints": 1500,
  "totalCampaignsCreated": 10,
  "isManualOverride": false,
  "currentLevel": {
    "name": "Active",
    "minPoints": 1001,
    ...
  }
}
```

#### Get Customer Progression
Retrieves the current status of a customer. **Triggers a check-and-update cycle.**
- **Endpoint**: `GET /progression/customer/:id`
- **Access**: Customer (Participant), Admin
- **Response**: `CustomerProgression`

#### Get Progression History
View the log of all level changes for a specific entity.
- **Endpoint**: `GET /progression/history/business/:id` OR `/progression/history/customer/:id`
- **Access**: Owner, Admin
- **Response**: `ProgressionHistory[]`
```json
[
  {
    "fromLevelName": "Starter",
    "toLevelName": "Active",
    "reason": "AUTOMATIC_UPGRADE",
    "changedBy": "SYSTEM",
    "created_at": "2023-10-27T10:00:00Z"
  }
]
```

---

### 4.2. Admin Endpoints (Restricted)

#### Override Business Tier
Manually assign a tier to a business.
- **Endpoint**: `POST /progression/admin/override/business`
- **Access**: Admin Only
- **Payload**:
```json
{
  "businessId": "uuid-string",
  "levelId": "uuid-string",
  "adminId": "uuid-string"
}
```
- **Response**: Updated `BusinessProgression` object.

#### Override Customer Badge
Manually assign a badge to a customer.
- **Endpoint**: `POST /progression/admin/override/customer`
- **Access**: Admin Only
- **Payload**:
```json
{
  "participantId": "uuid-string",
  "badgeId": "uuid-string",
  "adminId": "uuid-string"
}
```
- **Response**: Updated `CustomerProgression` object.

#### Update Business Level Criteria
Modify the requirements or details of an existing business level.
- **Endpoint**: `PUT /progression/admin/levels/:id`
- **Access**: Admin Only
- **Payload**: `Partial<BusinessLevel>`
```json
{
  "minPoints": 500,
  "description": "New criteria for Starter level"
}
```
- **Response**: Updated `BusinessLevel` object.

#### Update Customer Badge Criteria
Modify the requirements or details of an existing customer badge.
- **Endpoint**: `PUT /progression/admin/badges/:id`
- **Access**: Admin Only
- **Payload**: `Partial<CustomerBadge>`
```json
{
  "minCampaignsJoined": 5
}
```
- **Response**: Updated `CustomerBadge` object.

#### Create Business Level
Create a new tier for businesses.
- **Endpoint**: `POST /progression/admin/levels`
- **Access**: Admin Only
- **Payload**: `Partial<BusinessLevel>`
```json
{
  "name": "Diamond",
  "minPoints": 20000,
  "minCampaigns": 100,
  "privileges": ["Exclusive Partner Support"],
  "description": "For our top partners"
}
```
- **Response**: Created `BusinessLevel` object.

#### Create Customer Badge
Create a new badge for customers.
- **Endpoint**: `POST /progression/admin/badges`
- **Access**: Admin Only
- **Payload**: `Partial<CustomerBadge>`
```json
{
  "description": "A rare gem"
}
```
- **Response**: Created `CustomerBadge` object.

---

## 5. QR Plaques Resource

### 5.1. Overview
The QR Plaques resource manages physical or digital QR codes assigned to businesses. These codes are generated automatically when a business subscribes to a specific Tier. Each Tier can have a defined number of QR codes (`qrCodeCount`).

### 5.2. Data Model (`QrPlaque`)
Represents a unique QR code plaque.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique identifier (UUID). |
| `code` | string | Unique 9-character alphanumeric code (case-sensitive). |
| `codeMaster` | Business | Relation to the Business that owns this plaque. |
| `currentOwner` | Participant | Relation to the Participant currently holding/using the plaque (nullable). |
| `status` | enum | Status of the plaque: `ACTIVE`, `INACTIVE`, `FOR_SALE`, `PENDING_ASSIGNMENT`. |

### 5.3. Business Logic
- **Generation**: When a business subscribes to a Tier (via `PaymentService`), the system checks the `qrCodeCount` of that Tier.
- **Allocation**: If the business has fewer plaques than the Tier allows, the system automatically generates new unique plaques to meet the quota.
- **Uniqueness**: Each generated code is a unique 9-character string.

### 5.4. API Reference

#### Get Business QR Plaques
Retrieves all QR plaques assigned to the authenticated business.
- **Endpoint**: `GET /qr-plaques/business`
- **Access**: Authenticated Business
- **Response**: `QrPlaque[]`

#### Get QR Plaque by Code
Retrieves details of a specific QR plaque using its unique code.
- **Endpoint**: `GET /qr-plaques/:code`
- **Access**: Public / Authenticated Users
- **Response**: `QrPlaque`
