# Point Package System Documentation

This document outlines the process of managing and purchasing Point Packages within the Mcom Loyalty API. It covers the administrative setup of packages and the business flow for purchasing them.

## 1. Admin: Setting Up Point Packages

Administrators can create, update, and manage point packages that are available for purchase by businesses. Packages can be restricted to specific subscription tiers.

### Create Point Package

**Endpoint:** `POST /point-packages/admin`

**Description:** Creates a new point package.

**Payload (`CreatePointPackageDto`):**

```typescript
interface CreatePointPackageDto {
  /** Name of the point package */
  name: string;

  /** Description of the point package (Optional) */
  description?: string;

  /** Number of points in the package */
  points: number;

  /** Price of the package */
  price: number;

  /** Currency of the price (Default: 'GBP') */
  currency?: string;

  /** Array of Tier IDs that can purchase this package */
  tier_ids: string[];

  /** Whether the package is active (Default: true) */
  is_active?: boolean;
}
```

**Response (`PointPackage`):**

```typescript
interface PointPackage {
  id: string;
  name: string;
  description: string;
  points: number;
  price: number;
  currency: string;
  tiers: Tier[]; // Array of Tier objects
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Update Point Package

**Endpoint:** `PATCH /point-packages/admin/:id`

**Description:** Updates an existing point package.

**Payload (`UpdatePointPackageDto`):**

Partial of `CreatePointPackageDto`. All fields are optional.

### Get All Packages

**Endpoint:** `GET /point-packages/admin`

**Description:** Retrieves a paginated list of all point packages.

**Query Parameters:**
- `page`: number (Default: 1)
- `limit`: number (Default: 10)

---

## 2. Business: Buying Point Packages

Businesses can view available packages based on their subscription tier and purchase them to top up their point balance.

### Get Available Packages

**Endpoint:** `GET /point-packages/business/available`

**Description:** Retrieves a list of point packages available for the currently logged-in business based on their subscription tier.

**Response:** Array of `PointPackage` objects.

### Buy Package

**Endpoint:** `POST /point-packages/business/buy`

**Description:** Initiates the purchase of a point package. This interacts with the payment provider (Stripe/PayPal) to create a payment intent or order.

**Payload:**

```typescript
interface BuyPackageDto {
  /** ID of the package to purchase */
  packageId: string;

  /** Payment provider ('stripe' or 'paypal') */
  provider: string;
}
```

**Response:**

Returns the payment initiation details (e.g., Stripe client secret or PayPal approval URL).

### Confirm Purchase

**Endpoint:** `POST /point-packages/business/confirm-purchase`

**Description:** Confirms the purchase after the payment has been successfully processed on the client side. This creates the `BusinessPointPackage` record and credits the points.

**Payload:**

```typescript
interface ConfirmPurchaseDto {
  /** Transaction ID from the payment provider */
  transactionId: string;

  /** Payment provider ('stripe' or 'paypal') */
  provider: string;
}
```

**Response (`BusinessPointPackage`):**

```typescript
interface BusinessPointPackage {
  id: string;
  business: Business;
  package: PointPackage;
  name: string; // Snapshot of package name
  initial_points: number;
  remaining_points: number;
  purchase_date: Date;
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED';
  transaction_id: string;
  created_at: Date;
  updated_at: Date;
}
```

### Get My Packages

**Endpoint:** `GET /point-packages/business/my-packages`

**Description:** Retrieves a list of point packages purchased by the business.

**Response:** Array of `BusinessPointPackage` objects.

---

## 3. Point Deduction Logic

When a business awards points to a participant, the system follows this hierarchy for deduction:

1.  **Monthly Allowance:** Points are first deducted from the business's monthly allowance provided by their subscription tier.
2.  **Legacy Extra Points:** If the monthly allowance is exhausted, points are deducted from any legacy "Extra Points" balance the business may have.
3.  **Point Packages:** If both the monthly allowance and legacy points are insufficient, points are deducted from active `BusinessPointPackage`s, prioritizing the oldest active packages first.
