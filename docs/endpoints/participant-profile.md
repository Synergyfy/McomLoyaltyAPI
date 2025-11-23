# Participant Profile Endpoint

## Overview
This endpoint allows a **Participant** to retrieve their profile information, including their global point balance and point balances for each campaign they are participating in.

- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `Role.Participant`

## Get Participant Profile

Retrieves the authenticated participant's profile details.

- **URL**: `/participant/me`
- **Method**: `GET`

### Example Request
```http
GET /participant/me
Authorization: Bearer <token>
```

### Success Response (200 OK)

```json
{
  "id": "participant-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "participant",
  "uniqueCode": "ABC123XYZ",
  "global_total_points": 500,
  "matching_points": 50,
  "point_utilization": 60.00,
  "total_points_earned": 500,
  "total_points_redeemed": 300,
  "isDisabled": false,
  "created_at": "2023-01-01T00:00:00.000Z",
  "updated_at": "2023-11-23T12:00:00.000Z",
  "campaign_balances": [
    {
      "campaign_id": "campaign-uuid-1",
      "campaign_name": "Summer Sale",
      "balance": 200
    },
    {
      "campaign_id": "campaign-uuid-2",
      "campaign_name": "Winter Promo",
      "balance": 300
    }
  ]
}
```

### Error Responses

- **401 Unauthorized**:
  - If the token is missing or invalid.

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```
