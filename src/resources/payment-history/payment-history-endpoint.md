# Payment History Endpoint Documentation

## Get All Payment History

This endpoint retrieves a paginated list of all payment history records. It is restricted to administrators.

### Endpoint Details

- **URL:** \`/payment-history\`
- **Method:** \`GET\`
- **Auth required:** Yes (Bearer Token, Admin Role)

### Request Parameters

#### Query Parameters

| Field  | Type   | Default | Description |
| :---   | :---   | :---    | :---        |
| \`page\` | number | 1       | The page number to retrieve. Must be >= 1. |
| \`limit\`| number | 10      | The number of items per page. Must be >= 1. |

### Response Structure

The response is a JSON object containing the pagination metadata and the array of payment history records.

#### Response Body

\`\`\`json
{
  "data": [
    {
      "id": "uuid-string",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "deleted_at": null,
      "user_type": "string",
      "amount": 100.00,
      "payment_provider": "stripe", // or "paypal"
      "transaction_id": "tx_123456789",
      "status": "succeeded", // "failed", "pending"
      "purchaseType": "membership", // "extra_points"
      "pointsPurchased": null, // or number if purchaseType is extra_points
      "user": {
        // Business entity object
        "id": "uuid-string",
         // ... other business fields
      },
      "membership": {
        // Membership entity object (nullable)
        "id": "uuid-string",
        // ... other membership fields
      }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10,
  "next": 2,
  "previous": null
}
\`\`\`

#### Field Descriptions

- **data**: An array of payment history objects.
  - **id**: Unique identifier (UUID).
  - **created_at**: Timestamp when the record was created.
  - **updated_at**: Timestamp when the record was last updated.
  - **user**: The `Business` entity associated with the payment.
  - **user_type**: Type of the user (e.g., 'business').
  - **membership**: The `Membership` entity associated with the payment (if applicable).
  - **amount**: The payment amount.
  - **payment_provider**: The provider used (e.g., 'stripe', 'paypal').
  - **transaction_id**: The transaction ID from the payment provider.
  - **status**: Status of the payment (`succeeded`, `failed`, `pending`).
  - **purchaseType**: The type of purchase (`membership`, `extra_points`).
  - **pointsPurchased**: The number of points purchased (if `purchaseType` is `extra_points`).
- **total**: Total number of records available.
- **page**: Current page number.
- **limit**: Number of items per page.
- **totalPages**: Total number of pages.
- **next**: Next page number (or null).
- **previous**: Previous page number (or null).
