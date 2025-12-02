# Point Top Up Documentation

This document explains the process of purchasing extra points for a business, including how to check the purchase configuration, initiate a purchase, confirm the transaction, and how administrators can set the point price.

## Overview

The point top-up feature allows businesses to purchase additional points when they are running low or want to exceed their monthly allowance. The process involves three main steps:
1.  **Check Configuration**: Retrieve the current point price and maximum buyable points.
2.  **Initiate Purchase**: Request to buy a specific number of points using a payment provider (Stripe or PayPal).
3.  **Confirm Purchase**: Verify the payment transaction and credit the points to the business account.

## 1. Check Point Purchase Configuration

Before purchasing points, the frontend should fetch the current configuration to display the cost per point and the maximum number of points the business is allowed to buy.

### Endpoint
-   **URL**: `GET /business/points/purchase-config`
-   **Method**: `GET`
-   **Auth**: Bearer Token (Business Role)

### Response Interface
```typescript
interface PointPurchaseConfigResponse {
  maxBuyablePoints: number; // Maximum points the business can currently purchase
  costPerPoint: number;     // Cost per single point (e.g., 0.10)
  currency: string;         // Currency code (e.g., 'GBP')
}
```

### Example Response
```json
{
  "maxBuyablePoints": 500,
  "costPerPoint": 0.10,
  "currency": "GBP"
}
```

---

## 2. Initiate Point Purchase

To start the purchase process, send a request with the number of points and the selected payment provider.

### Endpoint
-   **URL**: `POST /business/points/buy`
-   **Method**: `POST`
-   **Auth**: Bearer Token (Business Role)

### Request Interface
```typescript
interface BuyPointsRequest {
  points: number;                 // Number of points to purchase (min: 1)
  provider: 'stripe' | 'paypal';  // Payment provider
  paymentMethod?: string;         // Optional: Payment method ID (Required for Stripe if not using a saved method)
}
```

### Response Interface
```typescript
interface BuyPointsResponse {
  success: boolean;
  orderId?: string;      // PayPal Order ID (if provider is 'paypal')
  clientSecret?: string; // Stripe Client Secret (if provider is 'stripe')
  cost: number;          // Total cost of the purchase
  currency: string;      // Currency code
}
```

### Example Request (Stripe)
```json
{
  "points": 100,
  "provider": "stripe"
}
```

### Example Response (Stripe)
```json
{
  "success": true,
  "clientSecret": "pi_1234567890_secret_1234567890",
  "cost": 10.00,
  "currency": "GBP"
}
```

---

## 3. Confirm Point Purchase

After the payment has been successfully processed on the client side (e.g., using Stripe Elements or PayPal Buttons), call this endpoint to verify the transaction on the server and credit the points.

### Endpoint
-   **URL**: `POST /business/points/buy/confirm`
-   **Method**: `POST`
-   **Auth**: Bearer Token (Business Role)

### Request Interface
```typescript
interface ConfirmPointPurchaseRequest {
  transactionId: string;          // PaymentIntent ID (Stripe) or Order ID (PayPal)
  provider: 'stripe' | 'paypal';  // Payment provider used
}
```

### Response Interface
```typescript
interface ConfirmPointPurchaseResponse {
  success: boolean;
  pointsPurchased: number;        // Number of points credited
  newBalance: {                   // Updated monthly balance
    monthlyLimit: number;
    used: number;
    remaining: number;
    extraPoints: number;
    maxBuyable: number;
  };
}
```

### Example Request
```json
{
  "transactionId": "pi_1234567890",
  "provider": "stripe"
}
```

---

## 4. Admin Configuration (Set Point Price)

Administrators can set the cost per point using the System Settings API. This setting determines the price businesses pay for extra points.

### Endpoint
-   **URL**: `POST /admin/settings`
-   **Method**: `POST`
-   **Auth**: Bearer Token (Admin Role)

### Request Interface
```typescript
interface CreateSystemSettingRequest {
  key: string;   // Must be 'POINT_PRICE_GBP'
  value: string; // The price per point (e.g., '0.10')
}
```

### Example Request
```json
{
  "key": "POINT_PRICE_GBP",
  "value": "0.15"
}
```

### Notes
-   The key `POINT_PRICE_GBP` is reserved for the point price configuration.
-   The value should be a string representing a valid number.
-   Changes to this setting take effect immediately for all new purchase requests.
