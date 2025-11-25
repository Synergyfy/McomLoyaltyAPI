# Admin: Create Reward

This endpoint allows an administrator to create a new reward in the system.

## Endpoint

`POST /api/v1/rewards/admin/rewards`

## Authentication

-   **Requires Authentication:** Yes
-   **Role:** Admin
-   **Header:** `Authorization: Bearer <token>`

## Request Body

The request body should be a JSON object with the following fields:

| Field | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `title` | string | Yes | The title of the reward. | `"Free Coffee"` |
| `points_required` | number | Yes | The points required to redeem the reward. | `1000` |
| `value` | number | Yes | The monetary value of the reward. | `5` |
| `description` | string | Yes | A short description of the reward. | `"A free coffee of your choice"` |
| `image` | string | Yes | The URL of the reward image. | `"https://example.com/coffee.jpg"` |
| `quantity` | number | No | The quantity of the reward available. | `100` |
| `reward_type` | enum | Yes | The type of the reward. Options: `VOUCHER`, `PHYSICAL`, `DIGITAL`. | `"VOUCHER"` |
| `badge_level` | enum | Yes | The badge level required. Options: `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`. | `"GOLD"` |
| `reward_source` | enum | Yes | The source of the reward. Options: `MCOM_VAULT`, `PARTNER`. | `"MCOM_VAULT"` |
| `audience` | enum | Yes | The target audience. Options: `ALL_BUSINESS`, `SPECIFIC_SECTORS`, `SPECIFIC_TIERS`. | `"ALL_BUSINESS"` |
| `expiry_datetime` | string | No | The expiry date and time (ISO 8601). | `"2024-12-31T23:59:59.999Z"` |
| `status` | enum | No | The status of the reward. Default: `ACTIVE`. | `"ACTIVE"` |
| `sector_ids` | string[] | No | List of sector IDs (required if audience is `SPECIFIC_SECTORS`). | `["uuid-1", "uuid-2"]` |
| `tier_ids` | string[] | No | List of tier IDs (required if audience is `SPECIFIC_TIERS`). | `["uuid-3", "uuid-4"]` |

## Example Request

```json
{
  "title": "Premium Lounge Access",
  "points_required": 5000,
  "value": 50,
  "description": "Access to the premium lounge for one day.",
  "image": "https://example.com/lounge.jpg",
  "quantity": 50,
  "reward_type": "VOUCHER",
  "badge_level": "PLATINUM",
  "reward_source": "MCOM_VAULT",
  "audience": "SPECIFIC_SECTORS",
  "expiry_datetime": "2025-12-31T23:59:59.999Z",
  "sector_ids": ["a1b2c3d4-e5f6-7890-1234-567890abcdef"]
}
```

## Example Response

**Status Code:** `201 Created`

```json
{
  "id": "c5d6e7f8-g9h0-1234-5678-90abcdef1234",
  "title": "Premium Lounge Access",
  "points_required": 5000,
  "value": 50,
  "description": "Access to the premium lounge for one day.",
  "image": "https://example.com/lounge.jpg",
  "quantity": 50,
  "reward_type": "VOUCHER",
  "badge_level": "PLATINUM",
  "reward_source": "MCOM_VAULT",
  "audience": "SPECIFIC_SECTORS",
  "expiry_datetime": "2025-12-31T23:59:59.999Z",
  "status": "ACTIVE",
  "disabled": false,
  "created_at": "2024-01-01T12:00:00.000Z",
  "updated_at": "2024-01-01T12:00:00.000Z",
  "sectors": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "Hospitality"
    }
  ],
  "tiers": []
}
```
