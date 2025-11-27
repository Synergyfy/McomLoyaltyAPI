# Create Campaign from Wishlist Aggregate

This endpoint allows a Business or an Admin to create a promotional campaign targeting a specific item that users have added to their wishlists.

## Endpoint

\`POST /campaigns/from-wishlist\`

## Authorization

- **Roles**: `Admin`, `Business`
- **Headers**: `Authorization: Bearer <token>`

## Description

When a campaign is created using this endpoint:
1. It is linked to the specified `WishlistAggregate`.
2. It identifies all participants who have the item in their wishlist (and have given marketing consent).
3. It sends an email notification to these participants announcing the new campaign.
4. It records the `initial_audience_size` for analytics.

## Request Body

The payload should be a JSON object matching the `CreateCampaignFromWishlistDto`.

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `wishlistAggregateId` | `string` (UUID) | Yes | The ID of the wishlist aggregate to target. |
| `name` | `string` | Yes | The name of the campaign. |
| `campaign_type` | `enum` | Yes | `QR_CODE` or `GEO_FENCING`. |
| `campaign_message` | `string` | Yes | The message to display for the campaign. |
| `start_date` | `string` (Date) | Yes | Start date of the campaign. |
| `end_date` | `string` (Date) | Yes | End date of the campaign. |
| `quantity` | `number` | Yes | Total quantity of rewards/participations available. |
| `audience_type` | `enum` | Yes | `ALL`, `NEW`, `RETURNING`, etc. |
| `banner_url` | `string` | Yes | URL of the campaign banner image. |
| `logo_url` | `string` | No | URL of the campaign logo. |
| `cta_text` | `string` | Yes | Call to action text (e.g., "Join Now"). |
| `cta_background_color` | `string` | Yes | Hex color code for CTA button background. |
| `cta_text_color` | `string` | Yes | Hex color code for CTA button text. |
| `text_color` | `string` | Yes | Hex color code for general text. |
| `background_color` | `string` | Yes | Hex color code for campaign background. |
| `signUpPoint` | `number` | No | Points awarded upon joining. |
| `reward_type` | `enum` | No | `REGULAR` or `MATCHING`. Default: `REGULAR`. |
| `regular_points_threshold` | `number` | No | Points required to redeem a regular reward. |
| `matching_points_threshold` | `number` | No | Points required to redeem a matching reward. |
| `business_reward_ids` | `string[]` (UUIDs) | No | List of Business Reward IDs to attach (for Business users). |
| `reward_ids` | `string[]` (UUIDs) | No | List of global Reward IDs to attach (for Admin users). |

### Example Payload

```json
{
  "wishlistAggregateId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "Summer Sale - Wireless Headphones",
  "campaign_type": "QR_CODE",
  "campaign_message": "Get 50% off on Wireless Headphones!",
  "start_date": "2023-06-01T00:00:00Z",
  "end_date": "2023-06-30T23:59:59Z",
  "quantity": 100,
  "audience_type": "ALL",
  "banner_url": "https://example.com/banner.jpg",
  "cta_text": "Shop Now",
  "cta_background_color": "#FF5733",
  "cta_text_color": "#FFFFFF",
  "text_color": "#000000",
  "background_color": "#FFFFFF",
  "business_reward_ids": ["b2c3d4e5-f6a7-8901-2345-678901bcdefg"]
}
```

## Response

The response will be the created `Campaign` (for Admins) or `BusinessCampaign` (for Businesses) object.

### Example Response (BusinessCampaign)

```json
{
  "id": "c3d4e5f6-a7b8-9012-3456-789012cdefgh",
  "name": "Summer Sale - Wireless Headphones",
  "uniqueCode": "XyZ123AbC",
  "initial_audience_size": 42,
  "wishlistAggregate": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "itemName": "Wireless Headphones",
    "audienceSize": 50
  },
  "created_at": "2023-05-25T10:00:00Z",
  "updated_at": "2023-05-25T10:00:00Z",
  ...
}
```
