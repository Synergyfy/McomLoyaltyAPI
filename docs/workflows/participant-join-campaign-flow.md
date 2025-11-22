# Participant Join Campaign Flow

This document outlines the workflows for participants joining a campaign, covering both new and existing customers.

## Overview

There are two main scenarios for joining a campaign:
1.  **New Customer**: Requires authentication (Login or Signup) before joining.
2.  **Existing User**: Can join directly if already authenticated.

---

## Scenario 1: New Customer

A new customer is a first-time user who hasn't joined any campaign before. They land on the campaign page and click "Join Campaign".

### Flow A: User has an account (Login)

1.  **Redirect**: User is redirected to the `/login` page.
2.  **Authentication**: User logs in using their email and password.
    *   **Endpoint**: `/api/v1/auth/login`
    *   **Method**: `POST`
    *   **Payload**:
        ```typescript
        interface LoginDto {
          email: string;
          password: string;
        }
        ```
3.  **Join Campaign (Background)**: After a successful login, the frontend should automatically send a request to join the campaign in the background.
    *   **Endpoint**: `/api/v1/participant/join-campaign`
    *   **Method**: `POST`
    *   **Headers**: `Authorization: Bearer <access_token>`
    *   **Payload**:
        ```typescript
        interface JoinCampaignDto {
          campaignId: string; // e.g., "clq0x0f5y0000t0z6c7j4a3b2"
        }
        ```
4.  **Redirect**: Redirect the user back to the campaign page.

### Flow B: User does not have an account (Signup)

1.  **Redirect**: User selects "Sign Up" on the login page and is redirected to the signup page.
2.  **Registration**: User completes the signup form.
    *   **Endpoint**: `/api/v1/participant/signup`
    *   **Method**: `POST`
3.  **Auto-Login & Join**: After successful signup, automatically log the user in using the **Participant Login** endpoint. This endpoint supports passing a `campaignId` to automatically join the campaign upon login.
    *   **Endpoint**: `/api/v1/participant/login`
    *   **Method**: `POST`
    *   **Payload**:
        ```typescript
        interface LoginParticipantDto {
          email: string;
          password: string;
          campaignId?: string; // Pass the campaign ID here to auto-join
        }
        ```
        *Example Payload*:
        ```json
        {
          "email": "john.doe@example.com",
          "password": "password123",
          "campaignId": "clq0x0f5y0000t0z6c7j4a3b2"
        }
        ```
4.  **Redirect**: Redirect the user back to the campaign page.

> **Important**: The frontend must persist the `campaignId` (e.g., in URL query params or local storage) throughout the login/signup flow to ensure it's available for the join request.

---

## Scenario 2: Existing User (Participated Before)

The user is already logged in or has a valid session.

1.  **Action**: User clicks "Join Campaign".
2.  **Join Request**: Send a request to join the campaign.
    *   **Endpoint**: `/api/v1/participant/join-campaign`
    *   **Method**: `POST`
    *   **Headers**: `Authorization: Bearer <access_token>`
    *   **Payload**:
        ```typescript
        interface JoinCampaignDto {
          campaignId: string;
        }
        ```
        *Example Payload*:
        ```json
        {
          "campaignId": "clq0x0f5y0000t0z6c7j4a3b2"
        }
        ```
3.  **Completion**: On success (HTTP 200), the user has joined.

---

## Checking Join Status

To check if a participant has already joined a specific campaign (e.g., to disable the "Join" button or show "Joined" status).

*   **Endpoint**: `/api/v1/participant-campaign-balance/is-joined`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Payload**:
    ```typescript
    interface IsJoinedDto {
      campaignId: string;
    }
    ```
*   **Response**:
    ```typescript
    interface IsJoinedResponse {
      isJoined: boolean;
    }
    ```
    *Example Response*:
    ```json
    {
      "isJoined": true
    }
    ```

## Summary of Endpoints

| Action | Endpoint | Method | Auth Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **General Login** | `/api/v1/auth/login` | `POST` | No | Standard login. Does **not** auto-join. |
| **Participant Login** | `/api/v1/participant/login` | `POST` | No | Supports `campaignId` for auto-join. |
| **Signup** | `/api/v1/participant/signup` | `POST` | No | Creates a new participant account. |
| **Join Campaign** | `/api/v1/participant/join-campaign` | `POST` | Yes | Joins an authenticated user to a campaign. |
| **Check Status** | `/api/v1/participant-campaign-balance/is-joined` | `POST` | Yes | Checks if user is already a participant. |
