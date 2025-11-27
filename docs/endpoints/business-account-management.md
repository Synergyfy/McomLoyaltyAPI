# Business Account Management Endpoints

This document details the endpoints available for business owners to manage their account, subscription, and view billing history.

## 1. Get Subscription Level

Retrieves the current subscription level and status for the authenticated business.

- **URL:** `/business/subscription`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token)
- **Role:** `Business`

### Success Response

**Code:** `200 OK`

**Content:**

```json
{
  "tier": "Gold",
  "status": "active",
  "expiresAt": "2024-12-31T23:59:59.999Z",
  "planType": "monthly"
}
```

### Error Response

**Code:** `401 Unauthorized`

**Content:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 2. Get Billing History

Retrieves the billing history for the authenticated business, ordered by date (newest first).

- **URL:** `/business/billing-history`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token)
- **Role:** `Business`

### Success Response

**Code:** `200 OK`

**Content:**

```json
[
  {
    "id": "payment_123",
    "amount": 99.99,
    "currency": "USD",
    "status": "succeeded",
    "created_at": "2023-11-27T10:00:00.000Z",
    "membership": {
        "tier": {
            "name": "Gold"
        }
    }
  },
  {
    "id": "payment_122",
    "amount": 99.99,
    "currency": "USD",
    "status": "succeeded",
    "created_at": "2023-10-27T10:00:00.000Z",
     "membership": {
        "tier": {
            "name": "Gold"
        }
    }
  }
]
```

---

## 3. Get Onboarding Status

Checks if the business has completed the necessary onboarding steps (e.g., selecting a sector and category).

- **URL:** `/business/onboarding-status`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token)
- **Role:** `Business`

### Success Response

**Code:** `200 OK`

**Content:**

```json
{
  "isOnboarded": true,
  "missingFields": []
}
```

**Content (Incomplete Onboarding):**

```json
{
  "isOnboarded": false,
  "missingFields": ["category"]
}
```
