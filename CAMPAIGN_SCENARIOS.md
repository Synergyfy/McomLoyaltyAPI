# Campaign Point System Scenarios

This document explains the process of earning points and redeeming rewards through real-world scenarios involving a Business, a Staff member, and a Participant.

## The Players

1.  **Business:** "Coffee Haven" (Unique Code: `COFFEE123`)
2.  **Staff:** "Barista Bob" (Unique Code: `BOB456789`)
3.  **Participant:** "Alice" (Unique Code: `ALICE0001`)

---

## Scenario 1: Earning Points (The "Loyalty Card" Experience)

Alice visits Coffee Haven and buys a Latte. She wants to earn points for her purchase.

### Method A: The Direct Scan (Staff Scans Participant)
*Alice presents her digital ID to Bob.*

1.  **Action:** Alice opens her app and shows her QR code (represented by her unique code `ALICE0001`).
2.  **Process:** Bob uses the Coffee Haven staff app to scan Alice's code.
3.  **System:**
    *   The app sends a request to `/participant-campaign-balance/scan-participant`.
    *   Payload: `{ participantCode: "ALICE0001", campaignId: "...", points: 50, type: "EARN" }`.
    *   The system verifies Bob is authorized staff.
    *   50 points are instantly added to Alice's balance for the campaign.
4.  **Result:** Alice gets a notification: "You earned 50 points!"

### Method B: The Printed Code (Receipt/Offline)
*Alice is in a rush, so Bob gives her a receipt with a code to claim later.*

1.  **Action:** Bob generates a unique claim code using the staff app.
2.  **System:**
    *   App calls `/participant-campaign-balance/generate-code`.
    *   Payload: `{ points: 50, type: "EARN", ... }`.
    *   System returns a 9-character code: `X9Z2P1Q3R`.
3.  **Process:** Bob writes `X9Z2P1Q3R` on Alice's receipt.
4.  **Claiming:** Later at home, Alice opens her app and enters the code.
    *   App calls `/participant-campaign-balance/claim-code`.
    *   Payload: `{ code: "X9Z2P1Q3R", ... }`.
5.  **Result:** The system validates the code (checking expiration and if used), marks it as `USED`, and awards Alice 50 points.

### Method C: Dual Verification (Remote/Phone)
*Alice calls in an order and wants points.*

1.  **Action:** Alice gives her code `ALICE0001` over the phone.
2.  **Process:** Bob enters his own staff code (`BOB456789`) and Alice's code into the system to authorize the transaction manually.
3.  **System:**
    *   App calls `/participant-campaign-balance/dual-scan`.
    *   Payload: `{ staffOrBusinessCode: "BOB456789", participantCode: "ALICE0001", points: 50, type: "EARN" }`.
4.  **Result:** The system verifies Bob's code belongs to him (or his business) and awards the points.

---

## Scenario 2: Redeeming Rewards (The "Free Coffee")

Alice has saved 500 points and wants to redeem a "Free Pastry" reward.

### Method A: The Direct Scan
1.  **Action:** Alice tells Bob she wants to use her points.
2.  **Process:** Bob selects the "Free Pastry" reward in his app and scans Alice's code.
3.  **System:**
    *   App calls `/participant-campaign-balance/scan-participant` with `type: "REDEEM"`.
    *   System checks if Alice has enough points (500).
    *   If yes, 500 points are deducted, and the transaction is logged.
4.  **Result:** Bob hands Alice her free pastry.

### Method B: The Voucher Code
1.  **Action:** Coffee Haven sends a "Sorry for the wait" email with a pre-generated reward code for a free cookie.
2.  **Process:** The business generates a code linked specifically to the "Free Cookie" reward ID.
3.  **Claiming:** Alice enters the code in her app.
4.  **Result:** The system processes the redemption (logging the usage of the reward) and adds the "Free Cookie" voucher to her wallet (or immediately marks it redeemed depending on campaign logic).

---

## Summary of Codes

| Entity | Code Type | Purpose |
| :--- | :--- | :--- |
| **Business/Staff** | `uniqueCode` (9 chars) | Identity verification for awarding points/redeeming. |
| **Participant** | `uniqueCode` (9 chars) | Identity verification for receiving points. |
| **Transaction** | Generated Code (9 chars) | Temporary token for offline/async point claiming. |
