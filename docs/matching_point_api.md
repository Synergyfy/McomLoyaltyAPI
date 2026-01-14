# Matching Point System API Documentation

The Matching Point system is a standalone loyalty infrastructure within the Mcom ecosystem that allows Participants and Businesses to earn and redeem specific "Matching Points". This system is separate from regular campaign points and includes its own rewards catalog and redemption logic.

## Base URL
`{{API_URL}}/api/v1/matching-points`

## Authorization
All endpoints (except Public ones) require a Bearer JWT Token.
Roles: `Admin`, `Business`, `Participant`.

---

## 1. Public Rewards Catalog

### Get Available Rewards (Paginated)
Fetches a list of rewards available for redemption based on the user's type and the reward's active status.

*   **URL:** `/rewards/public`
*   **Method:** `GET`
*   **Auth Required:** No (Public)
*   **Query Parameters:**
    *   `page`: number (default: 1)
    *   `limit`: number (default: 10)
    *   `target_audience`: `BUSINESS_ONLY`, `PARTICIPANT_ONLY`, or `BOTH` (Optional: Explicit audience filter)
    *   `search`: string (Filters by title/description)
    *   `min_points`: number
    *   `max_points`: number
    *   `start_date`: ISO Date String
    *   `end_date`: ISO Date String

*   **Success Response:**
    *   **Code:** 200
    *   **Payload:**
        ```json
        {
          "data": [
            {
              "id": "uuid",
              "title": "Free Tech Consult",
              "short_description": "30 min consultation",
              "required_points": 500,
              "main_image": "url",
              "target_audience": "BOTH",
              "quantity": 45,
              "start_datetime": "2026-01-01...",
              "end_datetime": "2026-12-31..."
            }
          ],
          "total": 1,
          "page": 1,
          "limit": 10,
          "totalPages": 1
        }
        ```

### Get Specific Reward Details
*   **URL:** `/rewards/:id`
*   **Method:** `GET`
*   **Auth Required:** No

---

## 2. Reward Management (Admin & Super Business)

### Create Matching Point Reward
Only Admins or Businesses with the `isSuperBusiness` flag can create rewards.

*   **URL:** `/rewards`
*   **Method:** `POST`
*   **Payload:**
    ```json
    {
      "title": "Luxury VIP Lounge Access",
      "short_description": "Exclusive access for partners",
      "long_description": "Full day access to the premium lounge...",
      "main_image": "https://...",
      "gallery_images": ["https://...", "https://..."],
      "required_points": 1200,
      "target_audience": "BUSINESS_ONLY", // Options: BUSINESS_ONLY, PARTICIPANT_ONLY, BOTH
      "quantity": 100,
      "start_datetime": "2026-01-14T12:00:00Z",
      "end_datetime": "2026-02-14T12:00:00Z"
    }
    ```
*   **Common Errors:**
    *   `403 Forbidden`: "Only Super Businesses can create rewards."

### Update Reward
*   **URL:** `/rewards/:id`
*   **Method:** `PATCH`
*   **Constraint:** Users can only edit rewards they created. Admins can edit any.

### Toggle Suspension
Suspended rewards are hidden from the public list and cannot be redeemed.
*   **URL:** `/rewards/:id/suspend`
*   **Method:** `PATCH`

### Delete Reward
*   **URL:** `/rewards/:id`
*   **Method:** `DELETE`

---

## 3. Redemption (User)

### Redeem a Reward
Deducts points from the user's matching point balance and records a redemption. This operation is atomic.

*   **URL:** `/rewards/:id/redeem`
*   **Method:** `POST`
*   **Auth Required:** Yes (`Business` or `Participant`)
*   **Success Response:**
    *   **Code:** 201
    *   **Payload:**
        ```json
        {
          "message": "Reward redeemed successfully",
          "redemption": {
            "id": "uuid",
            "points_spent": 500,
            "redeemer_type": "PARTICIPANT",
            "reward": { ... }
          }
        }
        ```
*   **Potential Error Messages:**
    *   `400 Bad Request`: "Insufficient matching points"
    *   `400 Bad Request`: "Reward is out of stock"
    *   `400 Bad Request`: "Reward is suspended"
    *   `400 Bad Request`: "Reward has expired"
    *   `403 Forbidden`: "This reward is for businesses only"

---

## 4. Balance & History

### Get Current Balance
*   **URL:** `/balance`
*   **Method:** `GET`
*   **Response:**
    ```json
    { "matching_points": 1250 }
    ```

### Get Point History (Paginated)
Shows all credits (earnings) and debits (redemptions).

*   **URL:** `/history`
*   **Method:** `GET`
*   **Query Parameters:** `page`, `limit`, `activity_type`, `search`
*   **Response:**
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "points": -500,
          "activity_type": "REWARD_REDEMPTION",
          "description": "Redeemed reward: Free Coffee",
          "balance_after": 750,
          "created_at": "..."
        },
        {
          "id": "uuid",
          "points": 100,
          "activity_type": "REFERRAL",
          "description": "Points for REFERRAL",
          "balance_after": 1250,
          "created_at": "..."
        }
      ],
      "total": 2
    }
    ```

---

## 5. System Configuration (Admin Only)

### Set Activity Points
Configure how many points are awarded for system activities.

*   **URL:** `/config`
*   **Method:** `PUT`
*   **Payload:**
    ```json
    {
      "activity_type": "REFERRAL", // Options: REFERRAL, CAMPAIGN_CREATION, MEMBERSHIP_PAYMENT
      "points": 50,
      "is_active": true
    }
    ```

### Manual Point Adjustment
Allows an admin to manually award or deduct points from any user.

*   **URL:** `/adjust`
*   **Method:** `POST`
*   **Payload:**
    ```json
    {
      "userId": "uuid",
      "userType": "PARTICIPANT",
      "points": 100, // Negative for deduction
      "description": "Correction for missed referral bonus"
    }
    ```
