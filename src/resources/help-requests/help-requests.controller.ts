import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { HelpRequestsService } from './help-requests.service';
import { CreateHelpRequestDto } from './dto/create-help-request.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { HelpRequestType } from './entities/help-request.entity';

@ApiTags('Help Requests')
@Controller('help-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class HelpRequestsController {
  constructor(private readonly helpRequestsService: HelpRequestsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Submit a new help request', 
    description: 'Allows Business Owners to request assistance from the 247GBS support team. The request is synced to the central hub and assigned to an agent.' 
  })
  @ApiBody({ 
    type: CreateHelpRequestDto,
    examples: {
      campaignHelp: {
        summary: 'Campaign Creation Help',
        value: {
          type: 'CAMPAIGN_CREATION',
          title: 'Launch Summer Sale Campaign',
          description: 'I need help setting up a double points campaign for the upcoming summer sale starting next week.'
        }
      },
      rewardHelp: {
        summary: 'Reward Config Help',
        value: {
          type: 'REWARD_CREATION',
          title: 'Create VIP Coffee Reward',
          description: 'Please help me create a reward that gives a free coffee for 500 points, available only to Gold Tier members.'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Help request successfully submitted and queued for assignment.',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        requesterId: 'user-uuid-123',
        type: 'CAMPAIGN_CREATION',
        title: 'Launch Summer Sale Campaign',
        description: 'I need help setting up...',
        status: 'SUBMITTED',
        createdAt: '2023-10-27T10:00:00.000Z',
        updatedAt: '2023-10-27T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized. User must be logged in.' })
  create(@Request() req, @Body() createDto: CreateHelpRequestDto) {
    return this.helpRequestsService.create(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'List submitted help requests', 
    description: 'Retrieves the history of all help requests submitted by the currently logged-in user.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of help requests.',
    schema: {
      example: [
        {
          id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          type: 'CAMPAIGN_CREATION',
          title: 'Launch Summer Sale',
          status: 'SUBMITTED',
          createdAt: '2023-10-27T10:00:00.000Z'
        }
      ]
    }
  })
  findAll(@Request() req) {
    return this.helpRequestsService.findAll(req.user.id);
  }
}
