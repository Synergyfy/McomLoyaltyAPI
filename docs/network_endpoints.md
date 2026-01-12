# Network API Endpoints

This document outlines the API endpoints accessible to users with the **Network** role (including Partners). These endpoints allow Network users to manage QR Plaques and participate in Group Circles.

## Authentication
All endpoints (except where noted) require a valid **Bearer Token** in the `Authorization` header.
`Authorization: Bearer <your_jwt_token>`

---

## QR Plaques

### 1. Accept Plaque Assignment
**Endpoint:** `POST /qr-plaques/network/accept`

**Description:**
Allows a Network user to accept a plaque assignment using a unique invite code. The code is verified against the authenticated user's email. If valid, the plaque is assigned to their profile.

**Request Payload (JSON):**
```typescript
interface AcceptPlaquePayload {
  /**
   * The 6-digit invite code sent to the user via email.
   * Example: "123456"
   */
  code: string;
}
```

**Response Interface:**
```typescript
interface AcceptPlaqueResponse {
  message: string; // "Assignment accepted successfully"
  plaque: QrPlaque;
}
```

### 2. List Network Plaques
**Endpoint:** `GET /qr-plaques/network/list`

**Description:**
Retrieves a list of all QR Plaques assigned to the current authenticated Network user or Partner.

**Request Payload:** `None`

**Response Interface:**
```typescript
type NetworkPlaqueListResponse = QrPlaque[];
```

---

## Group Circles

### 1. List Group Circles
**Endpoint:** `GET /group-circles/network/list`

**Description:**
Returns a list of all Group Circles where the authenticated Network user is a member.

**Request Payload:** `None`

**Response Interface:**
```typescript
type GroupCircleListResponse = GroupCircle[];
```

### 2. Get Group Circle Details
**Endpoint:** `GET /group-circles/network/:id`

**Description:**
Retrieves the detailed information of a specific Group Circle. The user must be a member of the circle to access this endpoint.

**Request Parameters:**
*   `id` (path): The UUID of the Group Circle.

**Response Interface:**
```typescript
interface GroupCircleDetailsResponse extends GroupCircle {
  // Includes full relation data if loaded by the backend
}
```

### 3. Send Message
**Endpoint:** `POST /group-circles/network/:id/messages`

**Description:**
Sends a message within a Group Circle. The message can be a general group broadcast or a Direct Message (DM) to another specific member.

**Request Parameters:**
*   `id` (path): The UUID of the Group Circle.

**Request Payload (JSON):**
```typescript
interface SendMessageDto {
  /**
   * The text content of the message.
   */
  content: string;

  /**
   * Optional: ID of the recipient member for Direct Messages.
   * If omitted, the message is treated as a Group broadcast.
   */
  recipientId?: string;
  
  /**
   * Optional: Explicit sender ID. Usually inferred from the auth token.
   */
  senderId?: string;
}
```

**Response Interface:**
```typescript
interface SendMessageResponse extends GroupMessage {
  // Returns the created message object
}
```

### 4. Get Messages
**Endpoint:** `GET /group-circles/network/:id/messages`

**Description:**
Retrieves the message history for a specific Group Circle. It automatically filters Direct Messages (DMs) so that users only see DMs they sent or received.

**Request Parameters:**
*   `id` (path): The UUID of the Group Circle.

**Query Parameters:**
*   `page` (number, optional): Page number (default: 1).
*   `limit` (number, optional): Items per page (default: 10).
*   `type` (string, optional): Filter by message type (`GROUP` or `DIRECT`).

**Response Interface:**
```typescript
interface GetMessagesResponse {
  data: GroupMessage[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  }
}
```

---

## Shared Types & Interfaces

### QrPlaque
```typescript
enum QrPlaqueStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ASSIGNED = "ASSIGNED",
  FOR_SALE = "FOR_SALE",
}

interface QrPlaque {
  id: string;
  created_at: Date;
  updated_at: Date;
  
  uniqueCode: string; // 9-digit unique alpha-numeric code
  code: string;       // Legacy code field
  name: string;
  description: string;
  actionText: string;
  footerText?: string;
  contentUrl: string;
  qrCodeUrl?: string;
  price?: number;
  status: QrPlaqueStatus;
  
  // Relations (simplified)
  assignedPartner?: Partner;
  assignedBusiness?: Business;
  networkContact?: Network;
}
```

### GroupCircle
```typescript
enum GroupCircleType {
  // Defined in backend, e.g., SAVINGS, SOCIAL, etc.
}

enum GroupCircleDuration {
  // e.g. 30, 60, 90 days
}

enum InteractionLevel {
  // e.g. HIGH, LOW
}

enum GroupCircleStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  // etc.
}

interface GroupCircle {
  id: string;
  created_at: Date;
  updated_at: Date;

  name: string;
  description?: string;
  type: GroupCircleType;
  duration: GroupCircleDuration;
  interactionLevel: InteractionLevel;
  status: GroupCircleStatus;
  
  contributionAmount?: number;
  payoutFrequency?: string;
  currentRound: number;
  startDate?: Date;

  members: GroupCircleMember[];
}
```

### GroupCircleMember
```typescript
enum GroupCircleRole {
  CORE = "CORE",
  PERIPHERAL = "PERIPHERAL",
  // etc.
}

interface GroupCircleMember {
  id: string;
  role: GroupCircleRole;
  drawDate?: Date;
  // Relations
  network: Network;
}
```

### GroupMessage
```typescript
enum GroupMessageType {
  GROUP = "GROUP",
  DIRECT = "DIRECT",
}

interface GroupMessage {
  id: string;
  created_at: Date;
  updated_at: Date;

  content: string;
  type: GroupMessageType;
  senderName: string;
  senderId: string;
  recipientId?: string;
  recipientName?: string;
}
```
