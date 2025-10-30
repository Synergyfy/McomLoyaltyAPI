import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantService } from './participant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Wallet } from './entities/wallet.entity';
import { AuthService } from 'src/auth/auth.service';

describe('ParticipantService', () => {
  let service: ParticipantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantService,
        {
          provide: getRepositoryToken(Participant),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Campaign),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ParticipantService>(ParticipantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
