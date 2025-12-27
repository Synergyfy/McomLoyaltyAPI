# Business Reward Editing Guide

This guide explains how businesses can update their existing rewards.

## Update Reward Endpoint

Businesses can edit the details of a reward they have already added to their inventory.

### Endpoint
`PUT /business/rewards/:id`

- **`:id`**: The ID of the **BusinessReward** (not the global reward ID).

### Permissions
- **Role**: `Business`
- **Capability**: `UPDATE_REWARD` (Requires `canUpdateReward` flag in Tier Config).
- **Checks**:
    - The reward must belong to the authenticated business.

### Request Body (DTO)
All fields are optional. You only need to send the fields you want to update.

```typescript
export class UpdateBusinessRewardDto {
  @ApiProperty({
    description: 'The quantity of the reward available for the business',
    example: 100,
  })
  quantity?: number;

  @ApiProperty({
    description: 'The points required to redeem the reward',
    example: 1000,
  })
points_required?: number;
stamps_required?: number;

  @ApiProperty({
    description: 'The title of the reward',
    example: 'Free Coffee',
  })
  title?: string;

  @ApiProperty({
    description: 'The description of the reward',
    example: 'Get a free coffee with any purchase',
  })
  description?: string;

  @ApiProperty({
    description: 'The image URL of the reward',
    example: 'https://example.com/image.jpg',
  })
  image?: string;

  @ApiProperty({
    description: 'The monetary value of the reward',
    example: 5.00,
  })
  value?: number;

  @ApiProperty({
    description: 'The expiry date and time of the reward',
    example: '2024-12-31T23:59:59.000Z',
  })
  expiry_datetime?: Date;

  @ApiProperty({
    description: 'The status of the reward',
    enum: RewardStatus,
    example: RewardStatus.ACTIVE,
  })
  status?: RewardStatus;

  @ApiProperty({
    description: 'Whether the reward is disabled',
    example: false,
  })
  disabled?: boolean;
}
```

### Example Request

```json
{
  "quantity": 50,
    "points_required": 600,
    "stamps_required": 5,
  "title": "Updated Coffee Reward",
  "status": "INACTIVE"
}
```

### Response
Returns the updated `BusinessReward` object.
