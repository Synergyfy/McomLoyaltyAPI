# Admin Guide: Setup Matching Point Rules & Badges

## Overview
The **Participant Progression System** allows participants to earn "Matching Points" through various activities. These points determine their **Badge Level** (e.g., Bronze, Silver, Gold). Higher badge levels award higher **Multipliers**, which boost the points they earn from purchases and actions.

This guide explains how to configure the **Earning Actions** (rules for earning points) and **Participant Badges** (levels and benefits) using the Admin API.

---

## 1. Earning Actions (Point Rules)

Earning Actions define *how* and *how many* points a participant earns for specific activities.

### Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/participant-progression/earning-actions` | Create a new earning rule. |
| `GET` | `/participant-progression/earning-actions` | List all earning rules. |
| `PATCH` | `/participant-progression/earning-actions/:id` | Update an existing rule. |

### Data Structure (CreateEarningActionDto)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Human-readable name (e.g., "Daily Login Bonus"). |
| `key` | string | Yes | **CRITICAL**: The system key that triggers this action. See [System Keys](#system-keys) below. |
| `points` | integer | Yes | Base number of matching points to award. |
| `description` | string | No | Optional description for admins. |
| `actionParameters` | JSON | No | Configuration for limits (e.g., once per day). See [Action Parameters](#action-parameters). |
| `isActive` | boolean | No | Set to `false` to disable this rule temporarily. Default is `true`. |

### System Keys
You **must** use these exact keys for the system to recognize the action.

| Key | Trigger Event | Recommended Parameters |
| :--- | :--- | :--- |
| `LOGIN_DAILY` | Triggers when a user logs in (limited to once per day via code). | `{"daily": 1}` |
| `REGISTRATION` | Triggers immediately after a new participant signs up. | `{"once_lifetime": true}` |
| `PROFILE_COMPLETE` | Triggers when a participant fills out their profile fields. | `{"once_lifetime": true}` |
| `CAMPAIGN_JOIN` | Triggers when a participant joins a campaign. | `{"daily": 5}` (optional limit) |
| `PURCHASE` | Triggers after a Deal redemption/purchase. | Points are usually calculated from deal value, but this adds a fixed bonus if desired. |
| `REFERRAL_SUCCESS` | Triggers for the referrer when their invited friend signs up. | *None* |
| `APP_OPEN` | Triggers when the app is opened (tracked via track-app-open). | `{"daily": 1}` |
| `STREAK_7_DAY` | Triggers when a user logs in for 7 consecutive days. | *None* |

### Action Parameters (Limits)
Use the `actionParameters` JSON object to enforce frequency limits.

- **Once per Lifetime**:
  ```json
  {
    "once_lifetime": true
  }
  ```
- **Daily Limit** (e.g., max 1 time per day):
  ```json
  {
    "daily": 1
  }
  ```

---

## 2. Participant Badges (Levels)

Badges represent the user's status. They are assigned based on the total accumulated Matching Points.

### Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/participant-progression/badges` | Create a new badge level. |
| `GET` | `/participant-progression/badges` | List all badge levels. |
| `PATCH` | `/participant-progression/badges/:id` | Update a badge level. |

### Data Structure (CreateParticipantBadgeDto)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Name of the level (e.g., "Gold"). |
| `minPoints` | integer | Yes | Points required to reach this level. |
| `priority` | integer | Yes | Order of the level (1 = lowest, 10 = highest). Logic promotes users to the highest priority they qualify for. |
| `multiplier` | number | No | **Point Benchmark**: Multiplier applied to **ALL** points earned (e.g., `1.5` for 1.5x points). Default `1.0`. |
| `benefits` | string[] | No | List of benefits to display in the UI (e.g., `["Free Shipping", "Priority Support"]`). |
| `color` | string | No | Hex color code for the badge (e.g., `#FFD700`). |

### Example Setup

**1. Bronze (Entry Level)**
- `minPoints`: 0
- `priority`: 1
- `multiplier`: 1.0

**2. Silver**
- `minPoints`: 1000
- `priority`: 2
- `multiplier`: 1.25 (Earn 25% more points)

**3. Gold**
- `minPoints`: 5000
- `priority`: 3
- `multiplier`: 2.0 (Double points)

---

## 3. Workflow Example

1.  **Admin** creates an Earning Action:
    -   Name: "Daily Login"
    -   Key: `LOGIN_DAILY`
    -   Points: 10
    -   Params: `{"daily": 1}`

2.  **Participant** logs in:
    -   System checks `LOGIN_DAILY` rule.
    -   System checks if user already converted `LOGIN_DAILY` today (via PointHistory).
    -   If not, awards **10 Matching Points**.
    -   Checks if Participant's total Matching Points creates a Badge promotion.

3.  **Promotion**:
    -   If Participant reaches 1000 points, they are automatically promoted to **Silver**.
    -   Next time they purchase a deal worth 100 points, they receive `100 * 1.25 = 125` points thanks to the Silver multiplier.
