# Staff & Business Ongoing Campaigns Endpoint Documentation

## Overview
This endpoint retrieves a paginated list of all ongoing campaigns associated with the authenticated user's business. It is accessible to users with the **Staff** or **Business** role.

- **URL**: `/campaigns/staff/ongoing`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `Role.Staff`, `Role.Business`

## Request

### Headers
| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <token>` | Valid JWT token for a Staff or Business user. |

### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | `number` | No | `1` | The page number to retrieve. |
| `limit` | `number` | No | `10` | The number of items per page. |

## Response

The response follows the `PaginatedCampaignResponseDto` structure.

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "uuid-string",
      "created_at": "2023-10-27T10:00:00.000Z",
      "updated_at": "2023-10-27T10:00:00.000Z",
      "name": "Summer Sale Campaign",
      "campaign_type": "qr_code", // enum: 'qr_code', 'referral', 'social_or_email', 'special_occasion'
      "campaign_message": "Scan to earn points!",
      "start_date": "2023-10-01T00:00:00.000Z",
      "end_date": "2023-12-31T23:59:59.000Z",
      "quantity": 1000,
      "audience_type": "members", // enum: 'members', 'badge_level', 'target_wishlist'
      "banner_url": "https://example.com/banner.jpg",
      "logo_url": "https://example.com/logo.jpg",
      "cta_text": "Join Now",
      "cta_background_color": "#FF0000",
      "cta_text_color": "#FFFFFF",
      "disabled": false,
      "text_color": "#000000",
      "background_color": "#FFFFFF",
      "signUpPoint": 50,
      "total_points_earned": 1500,
      "total_points_redeemed": 500,
      "reward_type": "regular", // enum: 'regular', 'matching', 'both'
      "regular_points_threshold": 100,
      "matching_points_threshold": null,
      "total_matching_points_earned": 0,
      "matching_points_disabled_by_admin": false,
      "uniqueCode": "ABC123XYZ",
      "earn_point_page_title": "Earn Points",
      "earn_point_page_description": "Visit us to earn.",
      "redeem_reward_page_title": "Redeem Rewards",
      "redeem_reward_page_description": "Use your points here.",
      "contact_us_page_title": "Contact Us",
      "contact_us_page_description": "Get in touch.",
      "contact_email": "support@example.com",
      "contact_phone_number": "+1234567890",
      "footer_text": "Terms apply.",
      "business": {
        "id": "business-uuid",
        "name": "My Business",
        // ... other business fields
      },
      "rewards": [
        {
          "id": "reward-uuid",
          "title": "Free Coffee",
          "points_required": 100,
          "reward_type": "physical", // enum
          "badge_level": "bronze", // enum
          "reward_source": "business", // enum
          "audience": "all", // enum
          "expiry_datetime": "2024-01-01T00:00:00.000Z",
          "status": "active", // enum: 'active', 'inactive', 'archived'
          "value": 5.00,
          "description": "A delicious cup of coffee.",
          "image": "https://example.com/coffee.jpg",
          "quantity": 500,
          "disabled": false
        }
      ],
      "participantCount": 150 // Number of unique participants for this business
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Error Responses

- **401 Unauthorized**:
  - If the token is missing or invalid.
  - If a Staff user is not associated with any Business.

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Data Types & Enums

### CampaignType
- `qr_code`
- `referral`
- `social_or_email`
- `special_occasion`

### AudienceType
- `members`
- `badge_level`
- `target_wishlist`

### RewardType (Campaign Level)
- `regular`
- `matching`
- `both`

### RewardStatus (Reward Entity)
- `active`
- `inactive` (or other values as defined in your system)

## Frontend Integration Notes

1.  **Authentication**: Ensure the user is logged in as a Staff or Business owner and include their JWT in the `Authorization` header.
2.  **Pagination**: Use the `page` and `limit` query parameters to handle large lists of campaigns. The response includes `total` count to help calculate total pages.
3.  **Filtering**: The endpoint automatically filters for:
    - **Ongoing**: `start_date` <= NOW <= `end_date`
    - **Active**: `disabled` is `false`
    - **Ownership**: Campaigns owned by the business OR claimed by the business (via `BusinessCampaign`).
4.  **Rewards Display**: The `rewards` array in each campaign object contains the full details of rewards available in that campaign. Use `points_required`, `image`, `title`, and `description` to display reward cards.
5.  **Participant Count**: The `participantCount` field indicates the number of unique participants who have interacted with the campaign *specifically for this business*. For claimed campaigns (`BusinessCampaign`), this count reflects only the participants associated with the claiming business, not the total participants across all businesses.
