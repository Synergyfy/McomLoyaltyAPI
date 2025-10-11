# Business Resource API Documentation

This document provides a detailed guide on how to use the Business Resource API. It covers the endpoints for creating, authenticating, and managing business profiles.

---

## 1. Business Sign-up

This endpoint allows a new business to create a profile on the platform.

- **Method:** `POST`
- **Endpoint:** `/business/signup`

### Request Body (`CreateBusinessDto`)

The request body must be a JSON object with the following properties:

| Field         | Type     | Required | Description                                                  |
|---------------|----------|----------|--------------------------------------------------------------|
| `name`        | `string` | Yes      | The legal name of the business. Must be unique.              |
| `email`       | `string` | Yes      | The contact email for the business. Must be unique.          |
| `password`    | `string` | Yes      | The password for the business account.                       |
| `phone`       | `string` | Yes      | The primary phone number for the business.                   |
| `address`     | `string` | Yes      | The physical address of the business.                        |
| `sectorId`    | `string` | Yes      | The UUID of the sector/industry the business belongs to.     |
| `website`     | `string` | No       | The URL of the business's official website.                  |
| `socialMedia` | `object` | No       | A JSON object containing links to social media profiles.     |

**Example Request:**
```json
{
  "name": "The Gourmet Kitchen",
  "email": "contact@gourmetkitchen.com",
  "password": "aStrongPassword123!",
  "phone": "+1234567890",
  "address": "123 Foodie Lane, Culinary City",
  "sectorId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "website": "https://gourmetkitchen.com",
  "socialMedia": {
    "facebook": "https://facebook.com/gourmetkitchen",
    "instagram": "https://instagram.com/gourmetkitchen"
  }
}
```

### Success Response

On successful creation, the API will return the newly created business object.

**Example Response (201 Created):**
```json
{
  "id": "b1c2d3e4-f5a6-7890-1234-567890abcdef",
  "name": "The Gourmet Kitchen",
  "email": "contact@gourmetkitchen.com",
  "phone": "+1234567890",
  "address": "123 Foodie Lane, Culinary City",
  "website": "https://gourmetkitchen.com",
  "socialMedia": {
    "facebook": "https://facebook.com/gourmetkitchen",
    "instagram": "https://instagram.com/gourmetkitchen"
  },
  "uniqueCode": "123456789",
  "createdAt": "2025-10-10T23:43:16.351Z",
  "updatedAt": "2025-10-10T23:43:16.351Z"
}
```

---

## 2. Business Login

This endpoint allows a registered business to log in and receive authentication tokens.

- **Method:** `POST`
- **Endpoint:** `/auth/login`

### Request Body

The request body must be a JSON object with the following properties:

| Field      | Type     | Required | Description                     |
|------------|----------|----------|---------------------------------|
| `email`    | `string` | Yes      | The email of the business.      |
| `password` | `string` | Yes      | The password for the account.   |

**Example Request:**
```json
{
  "email": "contact@gourmetkitchen.com",
  "password": "aStrongPassword123!"
}
```

### Success Response

On successful authentication, the API will return an object containing an `access_token` and a `refresh_token`.

**Example Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 3. Refresh Access Token

This endpoint allows a business to obtain a new `access_token` and `refresh_token` by providing a valid, non-expired `refresh_token`.

- **Method:** `POST`
- **Endpoint:** `/auth/refresh`

### Request Body

The request body must be a JSON object with the following property:

| Field           | Type     | Required | Description                                     |
|-----------------|----------|----------|-------------------------------------------------|
| `refresh_token` | `string` | Yes      | The refresh token obtained during a prior login. |

**Example Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Success Response

On successful validation of the refresh token, the API will return a new set of tokens.

**Example Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (new)",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (new)"
}
```
