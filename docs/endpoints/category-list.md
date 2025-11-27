# Get All Categories

## Endpoint
`GET /categories`

## Description
Retrieves a list of all available categories in the system. This endpoint is public and does not require authentication. It is used to fetch the top-level categories under which subcategories, businesses, and deals are organized.

## Access Control
- **Role**: Public
- **Authentication**: None required

## Request

### Headers
No specific headers are required.

### Path Parameters
None.

### Query Parameters
None.

## Response

### Success Response (200 OK)
Returns an array of `Category` objects.

**Response Body Schema:**

```json
[
  {
    "id": "string (UUID)",
    "created_at": "string (ISO 8601 Date)",
    "updated_at": "string (ISO 8601 Date)",
    "deleted_at": "string (ISO 8601 Date) | null",
    "name": "string",
    "imageUrl": "string (URL) | null"
  }
]
```

**Example Response:**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "created_at": "2023-10-27T10:00:00.000Z",
    "updated_at": "2023-10-28T15:30:00.000Z",
    "deleted_at": null,
    "name": "Food & Dining",
    "imageUrl": "https://example.com/images/food-dining.jpg"
  },
  {
    "id": "b2c3d4e5-f678-9012-3456-7890abcdef12",
    "created_at": "2023-10-27T10:05:00.000Z",
    "updated_at": "2023-10-27T10:05:00.000Z",
    "deleted_at": null,
    "name": "Retail & Shopping",
    "imageUrl": null
  }
]
```

### Error Responses
- **500 Internal Server Error**: Unexpected server error.

## Implementation Details
- **Controller**: `CategoryController`
- **Method**: `findAll()`
- **Service**: `CategoryService.findAll()`
- **Source File**: `src/resources/category/category.controller.ts`

## Example Usage

### cURL
```bash
curl -X GET http://localhost:3000/categories \
  -H "Accept: application/json"
```

### JavaScript (Fetch)
```javascript
fetch('http://localhost:3000/categories')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```
