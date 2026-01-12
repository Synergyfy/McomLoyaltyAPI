# Super Business Matching Point System

Only businesses designated as "Super Businesses" (`isSuperBusiness: true`) can create Matching Point campaigns. These campaigns are joinable by other businesses and allow for a collaborative reward system.

## Super Business Login & Privileges

When a Super Business logs in:
- The `/auth/login` response and JWT payload include the `isSuperBusiness: true` flag.
- **Unlimited Access**: Super Businesses are exempt from all tier-based limitations, membership quotas, and subscription expiration checks.
- **Simplified Response**: The login response does not include the standard `subscription` object, as Super Businesses are platform-owned entities with unrestricted access to all features.

## 1. Super Business Authorization

Only businesses with the `isSuperBusiness` flag set to `true` can create `MATCHING_POINT` campaigns. This is typically set by an administrator.

## 2. Creating a Matching Point Campaign

Super Businesses create campaigns using the standard campaign creation endpoint, but they must specify the `campaign_type` as `matching_point`.

*   **Endpoint**: `POST /campaigns`
*   **Key Field**: `"campaign_type": "matching_point"`

These campaigns are designed to be joinable by other businesses (subsidiaries, partners, etc.).

## 3. How Businesses Join a Campaign

Participating businesses can join a Super Business's campaign using their unique ID.

*   **Endpoint**: `POST /campaigns/:id/join`
*   **Role Required**: `Business`
*   **Requirement**: The campaign must be of type `matching_point` and must not be owned by the joining business.

## 4. Awarding Matching Points to Businesses

Matching points can be awarded to businesses that have joined the campaign. The system uses a polymorphic "Scan" approach, where the recipient is identified by their `uniqueCode`.

### Option A: Scan Recipient (Participant or Business)
The Super Business scans the QR code or uses the `uniqueCode` of the recipient. The system automatically detects if the code belongs to a Participant or a Business.

*   **Endpoint**: `POST /participant-campaign-balance/scan-participant`
*   **Payload**:
    ```json
    {
      "participantCode": "RECIPIENT_UNIQUE_CODE",
      "campaignId": "MATCHING_CAMPAIGN_ID",
      "type": "EARN",
      "points": 100
    }
    ```

### Option B: Dual Scan
Used when both the performer and recipient codes are provided (e.g., from a device that scans both).

*   **Endpoint**: `POST /participant-campaign-balance/dual-scan`
*   **Payload**:
    ```json
    {
      "staffOrBusinessCode": "PERFORMER_CODE",
      "participantCode": "RECIPIENT_UNIQUE_CODE",
      "campaignId": "MATCHING_CAMPAIGN_ID",
      "type": "EARN",
      "points": 100
    }
    ```

> [!NOTE]
> When a Business is the recipient, the points are credited to their `matching_points` balance, and the transaction is logged as a `MATCHING` type in the history.

## 5. Tracking and Management

Participating businesses can track their matching point credits through the following endpoints:

*   **View Balance**: `GET /matching-points/balance`
    *   Returns the current `matching_points` total for the business.
*   **View History**: `GET /matching-points/history`
    *   Returns a paginated list of matching point transactions.

## 6. Logic Summary
1.  **Super Business** awards points via scan.
2.  System checks if `recipientCode` is a `Business`.
3.  System verifies the recipient business has **joined** the campaign.
4.  Points are added to the recipient's `matching_points` balance.
5.  Campaign's `total_matching_points_earned` is updated.
