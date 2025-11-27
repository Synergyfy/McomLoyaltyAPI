# Wishlist API Documentation

This document provides a detailed specification for the Wishlist module's API endpoints. It includes information on how to use each endpoint, the expected payloads, and the structure of the response data.

---

## 1. Create a Wishlist Item

This endpoint allows an authenticated participant to create a new wishlist item for themselves or for a third party (e.g., a friend or family member).

- **Endpoint:** `POST /wishlist`
- **Authentication:** Required (Participant role)

### Request Payload (`CreateWishlistDto`)

The payload is a JSON object with the following properties:

| Field              | Type      | Required?                                                    | Description                                                                                             |
| ------------------ | --------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `itemName`         | `string`  | **Required**                                                 | The name of the desired item.                                                                           |
| `itemImageUrl`     | `string`  | Optional                                                     | A URL to an image of the item. Must be a valid URL format.                                              |
| `categoryId`       | `string`  | **Required**                                                 | The UUID of the category this item belongs to.                                                          |
| `occasion`         | `enum`    | Optional                                                     | The occasion for the item. Enum: `BIRTHDAY`, `ANNIVERSARY`, `NONE`, `CUSTOM`. Defaults to `NONE`.         |
| `season`           | `enum`    | Optional                                                     | The season associated with the item. Enum: `AUTUMN`, `WINTER`, `SUMMER`, `SPRING`, `NONE`. Defaults to `NONE`. |
| `targetDate`       | `Date`    | Optional                                                     | The target date for receiving the item (e.g., a birthday). Format: `YYYY-MM-DD`.                       |
| `priority`         | `enum`    | Optional                                                     | The priority of the item. Enum: `LOW`, `MEDIUM`, `HIGH`. Defaults to `MEDIUM`.                          |
| `marketingConsent` | `boolean` | **Required**                                                 | User must opt-in to receive offers for this item. If `false`, this item will not be in aggregates.    |
| `isForThirdParty`  | `boolean` | **Required**                                                 | `true` if the item is for someone else, `false` if for the user.                                        |
| `recipientName`    | `string`  | **Conditional**                                              | **Required** if `isForThirdParty` is `true`. The full name of the recipient.                            |
| `recipientEmail`   | `string`  | **Conditional**                                              | **Required** if `isForThirdParty` is `true` AND `recipientPhone` is not provided.                       |
| `recipientPhone`   | `string`  | **Conditional**                                              | **Required** if `isForThirdParty` is `true` AND `recipientEmail` is not provided.                       |
| `relationship`     | `enum`    | **Conditional**                                              | **Required** if `isForThirdParty` is `true`. Enum: `FATHER`, `MOTHER`, `BROTHER`, `SISTER`, `HUSBAND`, `WIFE`, `OTHERS`. |

### Response Data (`WishlistItem`)

The endpoint returns the newly created `WishlistItem` object upon success.

#### TypeScript Interface

```typescript
interface Category {
  id: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Participant {
  id: string;
  // ... other participant fields
}

interface WishlistItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  itemName: string;
  itemImageUrl: string | null;
  category: Category;
  participant: Participant;
  isForThirdParty: boolean;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  relationship: 'FATHER' | 'MOTHER' | 'BROTHER' | 'SISTER' | 'HUSBAND' | 'WIFE' | 'OTHERS' | null;
  occasion: 'BIRTHDAY' | 'ANNIVERSARY' | 'NONE' | 'CUSTOM';
  season: 'AUTUMN' | 'WINTER' | 'SUMMER' | 'SPRING' | 'NONE';
  targetDate: string | null; // Format: YYYY-MM-DD
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  marketingConsent: boolean;
}
```

#### Example JSON Response

```json
{
  "id": "e2a3b1c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
  "createdAt": "2024-10-27T10:00:00.000Z",
  "updatedAt": "2024-10-27T10:00:00.000Z",
  "deletedAt": null,
  "itemName": "running shoes",
  "itemImageUrl": "https://example.com/shoes.jpg",
  "isForThirdParty": true,
  "recipientName": "John Doe",
  "recipientEmail": "john.doe@example.com",
  "recipientPhone": null,
  "relationship": "BROTHER",
  "occasion": "BIRTHDAY",
  "season": "SUMMER",
  "targetDate": "2025-05-15",
  "priority": "HIGH",
  "marketingConsent": true,
  "category": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Footwear",
    "imageUrl": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z",
    "deletedAt": null
  },
  "participant": {
    "id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210"
  }
}
```
---

## 2. Get Business Wishlist Insights

This endpoint provides businesses with a paginated list of anonymized, aggregated data from user wishlists. It is designed to give insights into what items customers are interested in, allowing businesses to create targeted campaigns. The data only includes items from users who have given marketing consent.

- **Endpoint:** `GET /wishlist/business/wishlist-insights`
- **Authentication:** Required (Business or Admin role)

### Query Parameters (`PaginationDto`)

| Field   | Type     | Required? | Description                                      |
| ------- | -------- | --------- | ------------------------------------------------ |
| `page`  | `number` | Optional  | The page number to retrieve. Defaults to `1`.    |
| `limit` | `number` | Optional  | The number of items per page. Defaults to `10`. |

### Response Data (`Paginated<WishlistAggregate>`)

The endpoint returns a paginated response object containing an array of `WishlistAggregate` objects. Each object represents a unique combination of an item name and a category, and includes the total audience size and a list of target dates.

#### TypeScript Interface

```typescript
interface Category {
  id: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface WishlistAggregate {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  itemName: string;
  category: Category;
  audienceSize: number;
  targetDates: (string | null)[]; // Array of dates in YYYY-MM-DD format
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

#### Example JSON Response

```json
{
  "data": [
    {
      "id": "c1d2e3f4-a5b6-c7d8-e9f0-a1b2c3d4e5f6",
      "createdAt": "2024-10-27T12:00:00.000Z",
      "updatedAt": "2024-10-28T14:30:00.000Z",
      "deletedAt": null,
      "itemName": "running shoes",
      "category": {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "Footwear"
      },
      "audienceSize": 150,
      "targetDates": ["2025-05-15", "2025-06-01", null, "2025-05-20"]
    },
    {
      "id": "f6e5d4c3-b2a1-f0e9-d8c7-b6a5b4c3d2e1",
      "createdAt": "2024-10-26T08:00:00.000Z",
      "updatedAt": "2024-10-28T11:00:00.000Z",
      "deletedAt": null,
      "itemName": "leather handbag",
      "category": {
        "id": "b2c3d4e5-f6a7-b8c9-d0e1-f2a3b4c5d6e7",
        "name": "Accessories"
      },
      "audienceSize": 75,
      "targetDates": ["2024-12-25", "2025-02-14"]
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```
---

## 3. Create a Campaign Targeting a Wishlist (Conceptual)

This endpoint is a placeholder for the future functionality of creating a marketing campaign that directly targets users based on their wishlist items.

- **Endpoint:** `POST /wishlist/campaign/target-wishlist`
- **Authentication:** Required (Business or Admin role)

### Intended Functionality

This endpoint will not be implemented within the `Wishlist` module itself but rather in a dedicated `Campaign` module. Its purpose is to bridge the gap between wishlist insights and actionable marketing.

The intended flow is as follows:

1.  A business user reviews the data from the `GET /wishlist/business/wishlist-insights` endpoint and identifies an opportunity (e.g., 150 people want "running shoes").
2.  The user then calls this endpoint (or a similar one in the Campaign service) with a payload that defines the campaign details (e.g., discount, duration) and the targeting criteria (e.g., `itemName: "running shoes"`).
3.  The backend would create a new `Campaign` with a special `targetingRule` of `WISHLIST_MATCH`.
4.  A background job, as described in the [Campaign & Wishlist Integration Strategy](./CAMPAIGN_WISHLIST_INTEGRATION.md), would then match this active campaign to the relevant users' wishlists and send out targeted notifications (e.g., emails, push notifications) about the offer.

The implementation of this endpoint is considered out of scope for the initial Wishlist module but is a key part of the overall feature strategy.

---

## 4. Get My Wishlist (Participant)

This endpoint allows an authenticated participant to retrieve a paginated list of their own wishlist items.

- **Endpoint:** `GET /wishlist/my-wishlist`
- **Authentication:** Required (Participant role)

### Query Parameters (`PaginationDto`)

| Field   | Type     | Required? | Description                                      |
| ------- | -------- | --------- | ------------------------------------------------ |
| `page`  | `number` | Optional  | The page number to retrieve. Defaults to `1`.    |
| `limit` | `number` | Optional  | The number of items per page. Defaults to `10`. |

### Response Data (`Paginated<WishlistItem>`)

The endpoint returns a paginated response object containing an array of the participant's `WishlistItem` objects.

#### TypeScript Interface

```typescript
// Uses the same WishlistItem and Paginated interfaces defined in previous sections.
interface Paginated<WishlistItem> {
  data: WishlistItem[];
  total: number;
  page: number;
  limit: number;
}
```

#### Example JSON Response

```json
{
  "data": [
    {
      "id": "e2a3b1c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
      "createdAt": "2024-10-27T10:00:00.000Z",
      "updatedAt": "2024-10-27T10:00:00.000Z",
      "deletedAt": null,
      "itemName": "running shoes",
      "itemImageUrl": "https://example.com/shoes.jpg",
      "isForThirdParty": true,
      "recipientName": "John Doe",
      "recipientEmail": "john.doe@example.com",
      "recipientPhone": null,
      "relationship": "BROTHER",
      "occasion": "BIRTHDAY",
      "season": "SUMMER",
      "targetDate": "2025-05-15",
      "priority": "HIGH",
      "marketingConsent": true,
      "category": {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "Footwear"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```
