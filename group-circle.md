# Group Circle Documentation

The **Group Circle** resource allows businesses to create and manage collective financial or social groups (like ROSCA/Smart Money or simple community groups) with their network contacts.

## Roles & Access Control
- **Access**: All endpoints are restricted to users with the `Business` role.
- **Ownership**: Businesses can only access and manage circles they have created.

## Key Entities
- **GroupCircle**: The core group entity.
- **GroupCircleMember**: Links a network contact to a circle.
- **GroupCircleContribution**: Tracks payments for Smart Money circles.
- **GroupMessage**: Chat history (Group and Direct messages).
- **GroupActivity**: Audit log of events.

---

## API Endpoints & Data Examples

### 1. Circles Management

#### `POST /group-circles`
Create a new circle.
- **Payload**: `CreateGroupCircleDto`
  ```json
  {
    "name": "Savings Group 1",
    "description": "Weekly savings circle",
    "type": "SMART_MONEY",
    "duration": 90,
    "visibility": "PRIVATE",
    "interactionLevel": "HIGH",
    "contributionAmount": 50,
    "networkIds": [
      "550e8400-e29b-41d4-a716-446655440000",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
    ]
  }
  ```
- **Response Data**:
  ```json
  {
    "id": "circle-uuid",
    "name": "Savings Group 1",
    "description": "Weekly savings circle",
    "type": "SMART_MONEY",
    "duration": 90,
    "visibility": "PRIVATE",
    "interactionLevel": "HIGH",
    "status": "ACTIVE",
    "contributionAmount": 50,
    "payoutFrequency": "WEEKLY",
    "currentRound": 0,
    "startDate": "2023-10-27T10:00:00Z",
    "members": [
      {
        "id": "member-uuid",
        "role": "PERIPHERAL",
        "drawDate": "2023-11-03T10:00:00Z",
        "network": { "id": "net-uuid", "fullName": "John Doe" }
      }
    ]
  }
  ```

#### `GET /group-circles`
List all circles owned by the business.
- **Response Data**:
  ```json
  {
    "data": [ { "id": "uuid", "name": "Circle A", ... } ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "lastPage": 1,
      "nextPage": null,
      "prevPage": null
    }
  }
  ```

#### `GET /group-circles/:id`
Get full details of a specific circle.
- **Response Data**: Same as `POST /group-circles` response.

#### `PATCH /group-circles/:id`
Update basic info.
- **Response Data**: Updated `GroupCircle` object.

---

### 2. Member Management

#### `POST /group-circles/:id/members`
Add a member.
- **Response Data**:
  ```json
  {
    "id": "member-uuid",
    "role": "PERIPHERAL",
    "network": { "id": "net-uuid", "fullName": "Jane Doe" }
  }
  ```

#### `DELETE /group-circles/:id/members/:memberId`
Remove a member.
- **Response**: `200 OK` (No content).

#### `POST /group-circles/:id/assign-banker`
Assign a banker.
- **Response Data**:
  ```json
  { "id": "member-uuid", "role": "BANKER", ... }
  ```

#### `POST /group-circles/:id/swap-draw-dates`
Swap payout dates.
- **Response Data**:
  ```json
  { "message": "Draw dates swapped" }
  ```

---

### 3. Contributions (Smart Money Only)

#### `POST /group-circles/:id/contributions`
Record manual contribution.
- **Response Data**:
  ```json
  {
    "id": "contrib-uuid",
    "amount": 50,
    "round": 1,
    "status": "PAID",
    "paidAt": "2023-10-27T12:00:00Z",
    "provider": "MANUAL"
  }
  ```

#### `POST /group-circles/:id/contributions/initiate`
Initiate online payment.
- **Response Data (Stripe)**:
  ```json
  { "clientSecret": "pi_123_secret_abc" }
  ```
- **Response Data (PayPal)**:
  ```json
  { "orderId": "ORD-12345" }
  ```

#### `POST /group-circles/:id/contributions/verify`
Verify/Record online transaction.
- **Response Data**: Updated `GroupCircleContribution` object.

#### `GET /group-circles/contributions`
All contributions for the business.
- **Response Data**:
  ```json
  {
    "data": [ { "id": "uuid", "amount": 50, "groupCircle": { "name": "Circle 1" }, ... } ],
    "meta": {
       "total": 1,
       "page": 1,
       "limit": 20,
       "lastPage": 1,
       "nextPage": null,
       "prevPage": null
    }
  }
  ```

---

### 4. Messaging & Activity

#### `POST /group-circles/:id/messages`
Send message.
- **Response Data**:
  ```json
  {
    "id": "msg-uuid",
    "content": "Hello!",
    "type": "GROUP",
    "senderName": "Business Owner",
    "senderId": "bus-uuid",
    "created_at": "..."
  }
  ```

#### `GET /group-circles/:id/messages`
Get message history.
- **Response Data**:
  ```json
  {
    "data": [ { "id": "uuid", "content": "Hello", ... }, ... ],
    "meta": {
       "total": 10,
       "page": 1,
       "limit": 20,
       "lastPage": 1,
       "nextPage": null,
       "prevPage": null
    }
  }
  ```

#### `GET /group-circles/:id/activities`
Get activity log.
- **Response Data**:
  ```json
  {
    "data": [
      {
        "id": "activity-uuid",
        "action": "MEMBER_ADDED",
        "details": { "networkId": "net-uuid" },
        "created_at": "..."
      }
    ]
  }
  ```
