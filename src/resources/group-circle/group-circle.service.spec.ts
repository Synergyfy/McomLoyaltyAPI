import { Test, TestingModule } from "@nestjs/testing";
import { GroupCircleService } from "./group-circle.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { GroupCircle } from "./entities/group-circle.entity";
import { GroupCircleMember } from "./entities/group-circle-member.entity";
import { GroupMessage } from "./entities/group-message.entity";
import { GroupActivity } from "./entities/group-activity.entity";
import { GroupCircleContribution } from "./entities/group-circle-contribution.entity";

import { Network } from "../network/entities/network.entity";
import { StripeService } from "../payment/stripe.service";
import { PaypalService } from "../payment/paypal.service";
import { Repository } from "typeorm";
import { SendMessageDto } from "./dto/send-message.dto";
import { Business } from "../business/entities/business.entity";
import { GroupMessageType } from "./enums/group-circle.enums";
import { Referral } from "../referral/entities/referral.entity";

describe("GroupCircleService", () => {
  let service: GroupCircleService;
  let messageRepo: Repository<GroupMessage>;
  let memberRepo: Repository<GroupCircleMember>;
  let circleRepo: Repository<GroupCircle>;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn(),
    save: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockStripeService = {
    createPaymentIntent: jest.fn(),
    verifyPayment: jest.fn(),
  };

  const mockPaypalService = {
    createOrder: jest.fn(),
    capturePayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupCircleService,
        { provide: getRepositoryToken(GroupCircle), useValue: mockRepo },
        { provide: getRepositoryToken(GroupCircleMember), useValue: mockRepo },
        { provide: getRepositoryToken(GroupMessage), useValue: mockRepo },
        { provide: getRepositoryToken(GroupActivity), useValue: mockRepo },
        {
          provide: getRepositoryToken(GroupCircleContribution),
          useValue: mockRepo,
        },
        { provide: getRepositoryToken(Network), useValue: mockRepo },
        { provide: getRepositoryToken(Referral), useValue: mockRepo },
        { provide: StripeService, useValue: mockStripeService },
        { provide: PaypalService, useValue: mockPaypalService },
      ],
    }).compile();

    service = module.get<GroupCircleService>(GroupCircleService);
    messageRepo = module.get<Repository<GroupMessage>>(
      getRepositoryToken(GroupMessage),
    );
    memberRepo = module.get<Repository<GroupCircleMember>>(
      getRepositoryToken(GroupCircleMember),
    );
    circleRepo = module.get<Repository<GroupCircle>>(
      getRepositoryToken(GroupCircle),
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendMessage", () => {
    it("should send a group message", async () => {
      const dto: SendMessageDto = { content: "Hello Group" };
      const business = { id: "bus1", name: "Business 1" } as Business;
      const circleId = "circle1";

      jest
        .spyOn(circleRepo, "findOne")
        .mockResolvedValue({ id: circleId, business } as any);
      jest.spyOn(messageRepo, "create").mockReturnValue({
        id: "msg1",
        ...dto,
        type: GroupMessageType.GROUP,
      } as any);
      jest.spyOn(messageRepo, "save").mockResolvedValue({
        id: "msg1",
        ...dto,
        type: GroupMessageType.GROUP,
      } as any);

      const result = await service.sendMessage(circleId, dto, business);

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: GroupMessageType.GROUP,
          recipientId: null,
        }),
      );
      expect(result).toBeDefined();
    });

    it("should send a group message even if business name is missing in context", async () => {
      const dto: SendMessageDto = { content: "Hello Group" };
      const business = { id: "bus1" } as Business; // No name
      const circleId = "circle1";

      jest
        .spyOn(circleRepo, "findOne")
        .mockResolvedValue({ id: circleId, business } as any);

      // Mock manager.findOne to return full business with name
      jest.spyOn(circleRepo.manager, "findOne").mockResolvedValue({
        id: "bus1",
        name: "Fetched Business Name",
      } as any);

      jest
        .spyOn(messageRepo, "create")
        .mockImplementation((args) => args as any);
      jest
        .spyOn(messageRepo, "save")
        .mockImplementation((args) => Promise.resolve(args as any));

      const result = await service.sendMessage(circleId, dto, business);

      expect(circleRepo.manager.findOne).toHaveBeenCalledWith(
        Business,
        expect.objectContaining({ where: { id: "bus1" } }),
      );
      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderName: "Fetched Business Name",
          senderId: "bus1",
        }),
      );
      expect(result.senderName).toBe("Fetched Business Name");
    });

    it("should send a direct message", async () => {
      const dto: SendMessageDto = {
        content: "Hello Member",
        recipientId: "net1",
      };
      const business = { id: "bus1", name: "Business 1" } as Business;
      const circleId = "circle1";

      jest
        .spyOn(circleRepo, "findOne")
        .mockResolvedValue({ id: circleId, business } as any);
      jest.spyOn(memberRepo, "findOne").mockResolvedValue({
        id: "mem1",
        network: { id: "net1", fullName: "John Doe" },
      } as any);

      jest.spyOn(messageRepo, "create").mockReturnValue({
        id: "msg1",
        ...dto,
        type: GroupMessageType.DIRECT,
      } as any);
      jest.spyOn(messageRepo, "save").mockResolvedValue({
        id: "msg1",
        ...dto,
        type: GroupMessageType.DIRECT,
      } as any);

      const result = await service.sendMessage(circleId, dto, business);

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: GroupMessageType.DIRECT,
          recipientId: "net1",
          recipientName: "John Doe",
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe("getMessages", () => {
    it("should return messages", async () => {
      const businessId = "bus1";
      const circleId = "circle1";
      jest
        .spyOn(circleRepo, "findOne")
        .mockResolvedValue({ id: circleId } as any);
      jest.spyOn(messageRepo, "find").mockResolvedValue([]);

      await service.getMessages(circleId, businessId);
      expect(messageRepo.findAndCount).toHaveBeenCalled();
    });

    it("should filter messages by type and memberId", async () => {
      const businessId = "bus1";
      const circleId = "circle1";
      const memberId = "mem1";
      jest
        .spyOn(circleRepo, "findOne")
        .mockResolvedValue({ id: circleId } as any);
      jest.spyOn(messageRepo, "find").mockResolvedValue([]);

      await service.getMessages(
        circleId,
        businessId,
        1,
        20,
        GroupMessageType.DIRECT,
        memberId,
      );

      expect(messageRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            expect.objectContaining({
              senderId: memberId,
              type: GroupMessageType.DIRECT,
            }),
            expect.objectContaining({
              recipientId: memberId,
              type: GroupMessageType.DIRECT,
            }),
          ],
        }),
      );
    });
  });
});
