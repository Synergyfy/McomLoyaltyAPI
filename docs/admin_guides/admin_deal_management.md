# Admin Deal Management API Guide

This guide details the API endpoints available for administrators to manage deals within the system.

## Base URL
All endpoints are relative to the base URL of the API (e.g., `https://api.example.com`).

## Authentication
All admin endpoints require a valid JWT token with the `Admin` role.
Header: `Authorization: Bearer <token>`

---

## 1. List All Deals (Admin)
Retrieves a paginated list of all deals, including those from all businesses. This endpoint provides detailed information including the associated business and sector.

- **Endpoint**: `GET /deals/admin/all`
- **Query Parameters**:
    - `page` (optional, default: 1): Page number.
    - `limit` (optional, default: 10): Number of items per page.
    - `search` (optional): Search term for deal title or description.
    - `status` (optional): Filter by deal status (`pending`, `approved`, `declined`).
    - `categoryId` (optional): Filter by category ID.

### Response Example
```json
{
  "data": [
    {
      "id": "uuid-string",
      "title": "Summer Sale",
      "description": "50% off on all items",
      "value": 100.00,
      "status": "pending",
      "isApproved": false,
      "isActive": true,
      "business": {
        "id": "business-uuid",
        "name": "Fashion Store",
        "email": "fashion@store.com",
        "phone": "1234567890",
        "address": "123 Fashion St",
        "website": "https://fashionstore.com",
        "sector": {
          "id": "sector-uuid",
          "name": "Retail"
        }
      },
      "category": {
        "id": "category-uuid",
        "name": "Clothing"
      },
      "imageUrl": "https://example.com/image.jpg",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z",
      "termsAndConditions": "Terms apply.",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false,
    "next": 2,
    "previous": null
  }
}
```

---

## 2. Approve or Decline a Deal
Allows an admin to change the status of a deal. Setting the status to `approved` will automatically set the `isApproved` flag to `true`.

- **Endpoint**: `PATCH /deals/:id/status`
- **Path Parameters**:
    - `id`: The UUID of the deal.
- **Body**:
```json
{
  "status": "approved" // or "declined", "pending"
}
```

### Response Example
```json
{
  "id": "uuid-string",
  "title": "Summer Sale",
  "description": "50% off on all items",
  "value": 100.00,
  "status": "approved",
  "isApproved": true,
  "isActive": true,
  "imageUrl": "https://example.com/image.jpg",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "termsAndConditions": "Terms apply.",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "business": {
    "id": "business-uuid",
    "name": "Fashion Store"
  },
  "category": {
    "id": "category-uuid",
    "name": "Clothing"
  }
}
```

---

## 3. Get Deal Details
Retrieves the full details of a specific deal.

- **Endpoint**: `GET /deals/:id`
- **Path Parameters**:
    - `id`: The UUID of the deal.

### Response Example
```json
{
  "id": "uuid-string",
  "title": "Summer Sale",
  "description": "50% off on all items",
  "value": 100.00,
  "status": "pending",
  "isApproved": false,
  "isActive": true,
  "imageUrl": "https://example.com/image.jpg",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "termsAndConditions": "Terms apply.",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "business": {
    "id": "business-uuid",
    "name": "Fashion Store",
    "email": "fashion@store.com",
    "phone": "1234567890",
    "address": "123 Fashion St",
    "website": "https://fashionstore.com",
    "sector": {
      "id": "sector-uuid",
      "name": "Retail"
    }
  },
  "category": {
    "id": "category-uuid",
    "name": "Clothing"
  }
}
```

---

## 4. Edit a Deal
Allows an admin to modify the details of an existing deal.

- **Endpoint**: `PATCH /deals/:id`
- **Path Parameters**:
    - `id`: The UUID of the deal.
- **Body** (all fields are optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "value": 150.00,
  "categoryId": "new-category-uuid",
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-30T23:59:59Z"
}
```

### Response Example
Returns the updated deal object.

---

## 5. Delete a Deal
Permanently removes a deal from the system.

- **Endpoint**: `DELETE /deals/:id`
- **Path Parameters**:
    - `id`: The UUID of the deal.

### Response Example
```json
{
  "message": "Deal removed successfully"
}
```
