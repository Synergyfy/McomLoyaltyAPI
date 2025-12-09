# Frontend Integration Guide: Join Trial with Scheduled Payment

This guide explains the conceptual flow and integration steps for implementing the **Join Trial** feature on the frontend using Stripe.

## Overview

The "Join Trial" feature allows a user to sign up for a membership tier with an initial trial period (e.g., 30 days). Although the user is not charged immediately, we require their card details upfront. This allows us to:
1.  Verify the payment method is valid.
2.  Schedule an automatic payment to occur precisely when the trial ends.
3.  Ensure continuous service without requiring the user to return and pay later.

## Integration Flow

### 1. Payment Method Collection (Client-Side)
Instead of sending raw card numbers to our API (which is insecure), the frontend uses **Stripe Elements** (or a similar provided UI component from the payment provider).
- The user enters their card details into the secure input fields provided by Stripe.
- The frontend "tokenizes" this information by communicating directly with Stripe's servers.
- Stripe returns a safe reference to this payment method (a **Payment Method ID** or **Token**).

### 2. Initiating the Trial (API Call)
Once the frontend has the secure token from Stripe OR decides to use PayPal, it makes a POST request to the **Join Trial API endpoint**.

#### Payload Fields
- `tier_id` (**Required**): The UUID of the plan.
- `payment_token`: (**Required for Stripe**): Token from Stripe Elements.
- `provider`: `stripe` (default) or `paypal`.
- `return_url`: (**Required for PayPal**): URL to redirect back to after PayPal approval.
- `cancel_url`: (**Required for PayPal**): URL to redirect back to if user cancels PayPal.

### 3. Backend Processing & Response
When the API receives the request:
- **Stripe**: It creates a subscription immediately.
- **PayPal**: It creates a subscription request and returns an `approvalUrl`.

**Response Handling**:
- The API response might include an `approvalUrl` (for PayPal).
- If `approvalUrl` is present, **redirect the user's browser** to this URL.

### 4. Trial Expiration and Payment
- **Stripe**: Payment is automatic.
- **PayPal**: Payment is automatic via the agreed Billing Agreement.
- **Webhooks**: 
    - Stripe: `/payment/stripe-webhook`
    - PayPal: Ensure your PayPal app is configured to send Webhooks to the relevant endpoint (currently `/payment/paypal/verify-subscription` acts as a verification, but webhooks might be needed for recurring captures if not auto-handled).

## Key Frontend Responsibilities

- **Secure Input**: Always use the provider's libraries (e.g., `@stripe/react-stripe-js`) to collect card info. Never build your own card form.
- **Error Handling**: Handle cases where card tokenization fails (e.g., invalid card number) and display errors returned by the payment provider.
- **User Feedback**: Inform the user that they are starting a free trial but will be charged automatically at the end of the period unless they cancel.
