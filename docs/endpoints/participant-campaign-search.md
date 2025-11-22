# Participant Campaign Search Endpoint Documentation

## Overview
This endpoint allows **Staff** and **Business** users to search for a participant by their email address or unique code. It returns a list of all active campaigns that the participant is currently participating in *within the authenticated user's business*.

- **URL**: `/campaigns/participant/search`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `Role.Staff`, `Role.Business`

## Request

### Headers
| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <token>` | Valid JWT token for a Staff or Business user. |

### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | Yes | The participant's email address OR their unique code. |

### Example Request
```http
GET /campaigns/participant/search?query=john.doe@example.com
Authorization: Bearer <your_token>
```

## Response

The response is an array of `Campaign` objects.

### Success Response (200 OK)

```json
[
  {
    "id": "campaign-uuid",
    "name": "Summer Loyalty Program",
    "campaign_type": "qr_code",
    "start_date": "2023-06-01T00:00:00.000Z",
    "end_date": "2023-08-31T23:59:59.000Z",
    "disabled": false,
    "business": {
      "id": "business-uuid",
      "name": "My Business"
    },
    "rewards": [
      {
        "id": "reward-uuid",
        "title": "Free Smoothie",
        "points_required": 50
      }
    ]
    // ... other campaign fields
  }
]
```

### Error Responses

- **404 Not Found**:
  - If no participant is found matching the provided email or unique code.

```json
{
  "statusCode": 404,
  "message": "Participant not found",
  "error": "Not Found"
}
```

- **401 Unauthorized**:
  - If the token is missing or invalid.
  - If a Staff user is not linked to a valid Business.

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Usage Notes

1.  **Scope**: This endpoint only returns campaigns associated with the **requesting business**. Even if the participant is active in campaigns from other businesses, those will **not** be shown.
2.  **Participation Criteria**: A participant is considered "participating" if they have a `ParticipantCampaignBalance` record for the campaign. This record is created when they join the campaign or earn points.
3.  **Claimed Campaigns**: This includes both campaigns directly owned by the business and global campaigns that the business has claimed (via `BusinessCampaign`).
