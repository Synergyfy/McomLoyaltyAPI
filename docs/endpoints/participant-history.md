# Participant Transaction History Endpoints

## Overview
These endpoints allow a **Participant** to view their transaction history (points earned, redeemed, etc.). They can view history for a specific campaign or their entire history across all campaigns.

- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `Role.Participant`

## 1. Get All Transaction History

Retrieves a paginated list of all point transactions across all campaigns the participant has interacted with.

- **URL**: `/participant-campaign-balance/history`
- **Method**: `GET`

### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | `number` | No | 1 | The page number to retrieve. |
| `limit` | `number` | No | 10 | The number of items per page. |

### Example Request
```http
GET /participant-campaign-balance/history?page=1&limit=10
Authorization: Bearer <token>
```

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "history-uuid",
      "type": "EARN", // EARN, REDEEM, MATCHING
      "points": 100,
      "created_at": "2023-11-23T12:00:00.000Z",
      "description": "Purchase at Store A",
      "campaign": {
        "id": "campaign-uuid",
        "name": "Summer Sale"
      },
      "business": {
        "id": "business-uuid",
        "name": "Store A"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

## 2. Get Campaign Transaction History

Retrieves a paginated list of point transactions for a specific campaign.

- **URL**: `/participant-campaign-balance/history/:campaignId`
- **Method**: `GET`

### Path Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `campaignId` | `string` | Yes | The UUID of the campaign. |

### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | `number` | No | 1 | The page number to retrieve. |
| `limit` | `number` | No | 10 | The number of items per page. |

### Example Request
```http
GET /participant-campaign-balance/history/campaign-uuid?page=1&limit=10
Authorization: Bearer <token>
```

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "history-uuid",
      "type": "REDEEM",
      "points": -50,
      "created_at": "2023-11-24T10:00:00.000Z",
      "description": "Redeemed for Coffee",
      "reward": {
        "id": "reward-uuid",
        "title": "Free Coffee"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

### Error Responses

- **400 Bad Request**:
  - If the participant is not participating in the specified campaign.

```json
{
  "statusCode": 400,
  "message": "You are not participating in this campaign",
  "error": "Bad Request"
}
```

- **401 Unauthorized**:
  - If the token is missing or invalid.

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```
