# Voucher Management API for Businesses

This document outlines the API endpoints available to Business users for managing vouchers.

## Authentication

All endpoints require authentication. Requests must include an `Authorization` header with a valid `Bearer` token.

---

## 1. Create a New Voucher

Creates a new voucher owned by the authenticated business.

-   **Endpoint:** `POST /vouchers`
-   **Description:** Allows a business to create a new voucher that can be used in campaigns.

### Payload: `CreateVoucherDto`

```typescript
interface CreateVoucherDto {
    /**
     * The type of the voucher.
     * @enum {VoucherType}
     * @example "DISCOUNT"
     */
    type: "ITEM" | "DISCOUNT" | "ECARD" | "EVENT_TICKET" | "BUNDLE";

    /**
     * The title of the voucher.
     * @example "20% Off Any Purchase"
     */
    title: string;

    /**
     * The cost or value of the voucher.
     * @example 20.0
     */
    valueCost: number;

    /**
     * The value type of the voucher (e.g., currency or points).
     * @enum {VoucherValueType}
     * @example "MONETARY"
     */
    valueType: "MONETARY" | "POINTS";

    /**
     * The expiration date of the voucher.
     * @example "2024-12-31T23:59:59.999Z"
     */
    expiryDate: Date;

    /**
     * The total number of vouchers available.
     * @example 100
     */
    totalQuantity: number;

    /**
     * The rules for redeeming the voucher.
     * @example "Cannot be combined with other offers."
     */
    redemptionRules: string;
}
```

### Response: `Voucher`

The response will be the full voucher object upon successful creation.

```typescript
interface Voucher {
    id: string;
    creatorId: string;
    creatorType: "Admin" | "Business";
    type: "ITEM" | "DISCOUNT" | "ECARD" | "EVENT_TICKET" | "BUNDLE";
    title: string;
    valueCost: number;
    valueType: "MONETARY" | "POINTS";
    expiryDate: Date;
    totalQuantity: number;
    redeemedQuantity: number;
    redemptionRules: string;
    status: "ACTIVE" | "EXPIRED" | "FULFILLED" | "PARTIALLY_REDEEMED";
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
```

---

## 2. List Your Vouchers

Retrieves a paginated list of all vouchers created by the authenticated business.

-   **Endpoint:** `GET /vouchers`
-   **Description:** Returns a paginated list of vouchers owned by the business. Supports `page` and `limit` query parameters.

### Query Parameters

| Name  | Type    | Description                  | Default |
| :---- | :------ | :--------------------------- | :------ |
| `page`  | `number`| The page number to retrieve.   | `1`     |
| `limit` | `number`| The number of items per page. | `10`    |

### Response: `PaginatedVouchers`

```typescript
interface PaginatedVouchers {
    data: Voucher[];
    total: number;
    page: number;
    limit: number;
}
```

---

## 3. Get Voucher Details

Retrieves the details of a specific voucher.

-   **Endpoint:** `GET /vouchers/:id`
-   **Description:** Fetches a single voucher by its ID. The business must be the owner of the voucher.

### Response: `Voucher`

The response will be the full voucher object.

---

## 4. Update a Voucher

Updates the properties of an existing voucher.

-   **Endpoint:** `PATCH /vouchers/:id`
-   **Description:** Allows a business to update the details of a voucher they own. All fields are optional.

### Payload: `UpdateVoucherDto`

The payload is a partial version of the `CreateVoucherDto`.

```typescript
interface UpdateVoucherDto {
    type?: "ITEM" | "DISCOUNT" | "ECARD" | "EVENT_TICKET" | "BUNDLE";
    title?: string;
    valueCost?: number;
    valueType?: "MONETARY" | "POINTS";
    expiryDate?: Date;
    totalQuantity?: number;
    redemptionRules?: string;
}
```

### Response: `Voucher`

The response will be the full, updated voucher object.

---

## 5. Delete a Voucher

Deletes a voucher.

-   **Endpoint:** `DELETE /vouchers/:id`
-   **Description:** Permanently deletes a voucher owned by the business.

### Response

-   **Status:** `200 OK`
-   **Body:** `undefined`
