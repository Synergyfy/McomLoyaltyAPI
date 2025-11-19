# Business Campaign API Documentation

This document provides a detailed overview of the business-facing endpoints for the Campaign resource.

## Get All Claimable Campaigns

This endpoint retrieves a paginated list of all campaigns created by an admin that the current business has not yet claimed.

-   **Endpoint:** `GET /business/campaigns/claimable`
-   **Method:** `GET`
-   **Authentication:** `Bearer Token` (Business Role)

### Request

#### Query Parameters

-   `page` (optional): The page number to retrieve. Defaults to `1`.
-   `limit` (optional): The number of items to retrieve per page. Defaults to `10`.

**DTO:**

```typescript
class PaginationDto {
  @ApiProperty({
    description: 'The page number to retrieve.',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'The number of items to retrieve per page.',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
```

### Response

The response is a paginated list of `Campaign` objects.

**Typing:**

```typescript
interface PaginatedCampaignsResponse {
  data: Campaign[];
  total: number;
  page: number;
  limit: number;
}

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  campaign_message: string;
  start_date: string;
  end_date: string;
  quantity: number;
  audience_type: string;
  banner_url: string;
  logo_url: string | null;
  cta_text: string;
  cta_background_color: string;
  cta_text_color: string;
  text_color: string;
  background_color: string;
  disabled: boolean;
  rewards: Reward[];
}

interface Reward {
  id: string;
  title: string;
  points_required: number;
  value: number;
  description: string;
  image: string;
  quantity: number;
  disabled: boolean;
}
```

### Example

**Request:**

```bash
curl -X GET 'http://localhost:3000/business/campaigns/claimable?page=1&limit=5' \
--header 'Authorization: Bearer <your_token>'
```

**Response:**

```json
{
  "data": [
    {
      "id": "c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2",
      "name": "Summer Sale Campaign",
      "campaign_type": "qr_code",
      "campaign_message": "Get 20% off on all summer items!",
      "start_date": "2024-06-01T00:00:00.000Z",
      "end_date": "2024-08-31T23:59:59.999Z",
      "quantity": 1000,
      "audience_type": "members",
      "banner_url": "https://example.com/summer-sale-banner.jpg",
      "logo_url": "https://example.com/logo.png",
      "cta_text": "Shop Now",
      "cta_background_color": "#FF6347",
      "cta_text_color": "#FFFFFF",
      "text_color": "#000000",
      "background_color": "#F0E68C",
      "disabled": false,
      "rewards": [
        {
          "id": "r1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
          "title": "20% Off Coupon",
          "points_required": 100,
          "value": 20,
          "description": "A coupon for 20% off your next purchase.",
          "image": "https://example.com/coupon.png",
          "quantity": 500,
          "disabled": false
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 5
}
```

## Claim a Campaign

This endpoint allows a business to claim an admin-created campaign.

-   **Endpoint:** `POST /business/campaigns/:campaignId/claim`
-   **Method:** `POST`
-   **Authentication:** `Bearer Token` (Business Role)

### Request

#### URL Parameters

-   `campaignId` (required): The ID of the campaign to claim.

### Response

The response is the newly created `BusinessCampaign` object.

**Typing:**

```typescript
interface BusinessCampaign {
  id: string;
  uniqueCode: string;
  business: Business;
  campaign: Campaign;
}
```

### Example

**Request:**

```bash
curl -X POST 'http://localhost:3000/business/campaigns/c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2/claim' \
--header 'Authorization: Bearer <your_token>'
```

**Response:**

```json
{
  "id": "bc1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "uniqueCode": "aBcDeFgHi",
  "business": {
    "id": "b1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
    "name": "My Business"
  },
  "campaign": {
    "id": "c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2",
    "name": "Summer Sale Campaign"
  }
}
```

## Get All Campaigns Created by the Business

This endpoint retrieves a paginated list of all campaigns created by the current business.

-   **Endpoint:** `GET /business/campaigns/my-created-campaigns`
-   **Method:** `GET`
-   **Authentication:** `Bearer Token` (Business Role)

### Request

#### Query Parameters

-   `page` (optional): The page number to retrieve. Defaults to `1`.
-   `limit` (optional): The number of items to retrieve per page. Defaults to `10`.

### Response

The response is a paginated list of `Campaign` objects.

### Example

**Request:**

```bash
curl -X GET 'http://localhost:3000/business/campaigns/my-created-campaigns?page=1&limit=5' \
--header 'Authorization: Bearer <your_token>'
```

**Response:**

```json
{
  "data": [
    {
      "id": "c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c3",
      "name": "My Custom Campaign",
      "uniqueCode": "xYzAbCdEf",
      "campaign_type": "referral",
      "campaign_message": "Refer a friend and get 50 points!",
      "start_date": "2024-07-01T00:00:00.000Z",
      "end_date": "2024-09-30T23:59:59.999Z",
      "quantity": 500,
      "audience_type": "members",
      "banner_url": "https://example.com/my-campaign-banner.jpg",
      "logo_url": "https://example.com/logo.png",
      "cta_text": "Refer Now",
      "cta_background_color": "#32CD32",
      "cta_text_color": "#FFFFFF",
      "text_color": "#000000",
      "background_color": "#98FB98",
      "disabled": false,
      "rewards": []
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 5
}
```

## Get All Campaigns Claimed by the Business

This endpoint retrieves a paginated list of all campaigns claimed by the current business.

-   **Endpoint:** `GET /business/campaigns/my-claimed-campaigns`
-   **Method:** `GET`
-   **Authentication:** `Bearer Token` (Business Role)

### Request

#### Query Parameters

-   `page` (optional): The page number to retrieve. Defaults to `1`.
-   `limit` (optional): The number of items to retrieve per page. Defaults to `10`.

### Response

The response is a paginated list of `Campaign` objects.

### Example

**Request:**

```bash
curl -X GET 'http://localhost:3000/business/campaigns/my-claimed-campaigns?page=1&limit=5' \
--header 'Authorization: Bearer <your_token>'
```

**Response:**

```json
{
  "data": [
    {
      "id": "c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2",
      "name": "Summer Sale Campaign",
      "campaign_type": "qr_code",
      "campaign_message": "Get 20% off on all summer items!",
      "start_date": "2024-06-01T00:00:00.000Z",
      "end_date": "2024-08-31T23:59:59.999Z",
      "quantity": 1000,
      "audience_type": "members",
      "banner_url": "https://example.com/summer-sale-banner.jpg",
      "logo_url": "https://example.com/logo.png",
      "cta_text": "Shop Now",
      "cta_background_color": "#FF6347",
      "cta_text_color": "#FFFFFF",
      "text_color": "#000000",
      "background_color": "#F0E68C",
      "disabled": false,
      "rewards": []
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 5
}
```

## Get Campaign Analytics

This endpoint retrieves a paginated list of all campaigns associated with the business, along with their performance metrics.

-   **Endpoint:** `GET /business/campaigns/analytics`
-   **Method:** `GET`
-   **Authentication:** `Bearer Token` (Business Role)

### Request

#### Query Parameters

-   `page` (optional): The page number to retrieve. Defaults to `1`.
-   `limit` (optional): The number of items to retrieve per page. Defaults to `10`.

### Response

The response is a paginated list of campaign analytics objects.

**Typing:**

```typescript
interface PaginatedCampaignAnalyticsResponse {
  data: CampaignAnalytics[];
  total: number;
  page: number;
  limit: number;
}

interface CampaignAnalytics {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  disabled: boolean;
  sector: string;
  status: 'active' | 'inactive';
  total_participants: string;
  total_points_awarded: string;
  total_rewards_redeemed: string;
  redemption_rate: number;
}
```

### Example

**Request:**

```bash
curl -X GET 'http://localhost:3000/business/campaigns/analytics?page=1&limit=5' \
--header 'Authorization: Bearer <your_token>'
```

**Response:**

```json
{
  "data": [
    {
      "id": "c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2",
      "name": "Summer Sale Campaign",
      "start_date": "2024-06-01T00:00:00.000Z",
      "end_date": "2024-08-31T23:59:59.999Z",
      "disabled": false,
      "sector": "Retail",
      "status": "active",
      "total_participants": "150",
      "total_points_awarded": "15000",
      "total_rewards_redeemed": "75",
      "redemption_rate": 50
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 5
}
```

## Get Detailed Campaign Analytics

This endpoint retrieves detailed analytics for a specific campaign.

-   **Endpoint:** `GET /business/campaigns/:campaignId/analytics/detailed`
-   **Method:** `GET`
-   **Authentication:** `Bearer Token` (Business Role)

### Request

#### URL Parameters

-   `campaignId` (required): The ID of the campaign to retrieve analytics for.

### Response

The response is a detailed analytics object for the specified campaign.

**Typing:**

```typescript
interface DetailedCampaignAnalytics {
  total_participants: string;
  total_rewards_redeemed: string;
  total_points_awarded: string;
  redemption_rate: number;
  weekly_chart_data: WeeklyChartData[];
  ranked_participants: RankedParticipant[];
  top_rewards: TopReward[];
}

interface WeeklyChartData {
  date: string;
  points_awarded: string;
  rewards_redeemed: string;
  new_participants: string;
}

interface RankedParticipant {
  id: string;
  name: string;
  email: string;
  total_points_earned: string;
  total_redemptions: string;
}

interface TopReward {
  id: string;
  title: string;
  points_required: number;
  total_redemptions: string;
}
```

### Example

**Request:**

```bash
curl -X GET 'http://localhost:3000/business/campaigns/c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2/analytics/detailed' \
--header 'Authorization: Bearer <your_token>'
```

**Response:**

```json
{
  "total_participants": "150",
  "total_rewards_redeemed": "75",
  "total_points_awarded": "15000",
  "redemption_rate": 50,
  "weekly_chart_data": [
    {
      "date": "2024-07-22T00:00:00.000Z",
      "points_awarded": "2000",
      "rewards_redeemed": "10",
      "new_participants": "20"
    }
  ],
  "ranked_participants": [
    {
      "id": "p1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "total_points_earned": "500",
      "total_redemptions": "5"
    }
  ],
  "top_rewards": [
    {
      "id": "r1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
      "title": "20% Off Coupon",
      "points_required": 100,
      "total_redemptions": "50"
    }
  ]
}
```
