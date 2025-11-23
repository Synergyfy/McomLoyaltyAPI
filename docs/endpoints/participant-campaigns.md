# Participant Campaigns Endpoint

## Overview
This endpoint allows a **Participant** to retrieve a paginated list of all campaigns they are participating in.

- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `Role.Participant`

## Get Participating Campaigns

Retrieves a list of campaigns the authenticated participant has joined.

- **URL**: `/participant/campaigns`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (optional, default: 1): The page number.
  - `limit` (optional, default: 10): The number of items per page.

### Example Request
```http
GET /participant/campaigns?page=1&limit=10
Authorization: Bearer <token>
```

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "campaign-uuid-1",
      "name": "Summer Sale",
      "description": "Get 10% off",
      "start_date": "2023-06-01T00:00:00.000Z",
      "end_date": "2023-08-31T00:00:00.000Z",
      "type": "points",
      "status": "active",
      "balance": 200
    },
    {
      "id": "campaign-uuid-2",
      "name": "Winter Promo",
      "description": "Double points",
      "start_date": "2023-12-01T00:00:00.000Z",
      "end_date": "2024-02-28T00:00:00.000Z",
      "type": "points",
      "status": "active",
      "balance": 300
    }
  ],
  "total": 2
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
