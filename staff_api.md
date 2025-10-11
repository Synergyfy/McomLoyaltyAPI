# Staff Resource API Documentation

This document provides a detailed guide on how to use the Staff Resource API. It covers the endpoints for staff authentication and for businesses to manage their staff members.

---

## 1. Staff Login

This endpoint allows a registered staff member to log in and receive authentication tokens. This is a public endpoint and does not require a business to be logged in.

- **Method:** `POST`
- **Endpoint:** `/staff/login`

### Request Body

The request body must be a JSON object with the following properties:

| Field      | Type     | Required | Description                     |
|------------|----------|----------|---------------------------------|
| `email`    | `string` | Yes      | The email of the staff member.  |
| `password` | `string` | Yes      | The password for the account.   |

**Example Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "staffPassword123"
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

## 2. Create a New Staff Member

This endpoint allows a logged-in business to create a new staff member profile associated with their business.

- **Method:** `POST`
- **Endpoint:** `/staff`
- **Authentication:** Requires a **Business** JWT `access_token`.

### Request Body (`CreateStaffDto`)

The request body must be a JSON object with the following properties:

| Field      | Type     | Required | Description                                     |
|------------|----------|----------|-------------------------------------------------|
| `name`     | `string` | Yes      | The full name of the staff member.              |
| `email`    | `string` | Yes      | The email for the staff member (must be unique).|
| `password` | `string` | Yes      | The initial password for the staff account.     |
| `avatar`   | `string` | No       | A URL to an avatar image for the staff member.  |

**Example Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@gourmetkitchen.com",
  "password": "staffPassword456",
  "avatar": "https://example.com/avatars/jane.png"
}
```

### Success Response

On successful creation, the API will return the newly created staff object.

**Example Response (201 Created):**
```json
{
  "id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
  "name": "Jane Doe",
  "email": "jane.doe@gourmetkitchen.com",
  "avatar": "https://example.com/avatars/jane.png",
  "createdAt": "2025-10-11T09:43:18.963Z",
  "updatedAt": "2025-10-11T09:43:18.963Z"
}
```

---

## 3. Get All Staff Members

This endpoint allows a logged-in business to retrieve a list of all staff members associated with their business.

- **Method:** `GET`
- **Endpoint:** `/staff`
- **Authentication:** Requires a **Business** JWT `access_token`.

### Success Response

On success, the API will return an array of staff objects belonging to the business.

**Example Response (200 OK):**
```json
[
  {
    "id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
    "name": "Jane Doe",
    "email": "jane.doe@gourmetkitchen.com",
    "avatar": "https://example.com/avatars/jane.png",
    "createdAt": "2025-10-11T09:43:18.963Z",
    "updatedAt": "2025-10-11T09:43:18.963Z"
  },
  {
    "id": "d4e5f6a7-b8c9-0123-4567-890abcdef1",
    "name": "John Smith",
    "email": "john.smith@gourmetkitchen.com",
    "avatar": null,
    "createdAt": "2025-10-11T09:44:33.188Z",
    "updatedAt": "2025-10-11T09:44:33.188Z"
  }
]
```

---

## 4. Get a Single Staff Member by ID

This endpoint allows a logged-in business to retrieve a single staff member by their unique ID.

- **Method:** `GET`
- **Endpoint:** `/staff/:id`
- **Authentication:** Requires a **Business** JWT `access_token`.

### URL Parameters

| Parameter | Type     | Description                        |
|-----------|----------|------------------------------------|
| `id`      | `string` | The unique identifier of the staff member. |

### Success Response

On success, the API will return the requested staff object.

**Example Response (200 OK):**
```json
{
  "id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
  "name": "Jane Doe",
  "email": "jane.doe@gourmetkitchen.com",
  "avatar": "https://example.com/avatars/jane.png",
  "createdAt": "2025-10-11T09:43:18.963Z",
  "updatedAt": "2025-10-11T09:43:18.963Z"
}
```

---

## 5. Update a Staff Member

This endpoint allows a logged-in business to update the details of one of their existing staff members.

- **Method:** `PATCH`
- **Endpoint:** `/staff/:id`
- **Authentication:** Requires a **Business** JWT `access_token`.

### URL Parameters

| Parameter | Type     | Description                        |
|-----------|----------|------------------------------------|
| `id`      | `string` | The unique identifier of the staff member to update. |

### Request Body (`UpdateStaffDto`)

The request body is a JSON object where all properties are optional. Only the provided fields will be updated.

| Field      | Type     | Description                                     |
|------------|----------|-------------------------------------------------|
| `name`     | `string` | The new full name of the staff member.          |
| `email`    | `string` | The new email for the staff member (must be unique). |
| `password` | `string` | A new password for the staff account.           |
| `avatar`   | `string` | A new URL for the avatar image.                 |

**Example Request:**
```json
{
  "name": "Janeathan Doe",
  "avatar": "https://example.com/avatars/jane-new.png"
}
```

### Success Response

On successful update, the API will return the complete, updated staff object.

**Example Response (200 OK):**
```json
{
  "id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
  "name": "Janeathan Doe",
  "email": "jane.doe@gourmetkitchen.com",
  "avatar": "https://example.com/avatars/jane-new.png",
  "createdAt": "2025-10-11T09:43:18.963Z",
  "updatedAt": "2025-10-11T09:46:54.228Z"
}
```

---

## 6. Delete a Staff Member

This endpoint allows a logged-in business to delete one of their existing staff members.

- **Method:** `DELETE`
- **Endpoint:** `/staff/:id`
- **Authentication:** Requires a **Business** JWT `access_token`.

### URL Parameters

| Parameter | Type     | Description                        |
|-----------|----------|------------------------------------|
| `id`      | `string` | The unique identifier of the staff member to delete. |

### Success Response

A successful deletion will result in a `204 No Content` response.
