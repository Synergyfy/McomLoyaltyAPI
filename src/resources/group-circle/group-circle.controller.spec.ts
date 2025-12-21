import { Test, TestingModule } from "@nestjs/testing";
import { GroupCircleController } from "./group-circle.controller";
import { GroupCircleService } from "./group-circle.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { Business } from "../business/entities/business.entity";
import { GroupMessageType } from "./enums/group-circle.enums";

describe("GroupCircleController", () => {
  let controller: GroupCircleController;
  let service: GroupCircleService;

  const mockService = {
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupCircleController],
      providers: [{ provide: GroupCircleService, useValue: mockService }],
    }).compile();

    controller = module.get<GroupCircleController>(GroupCircleController);
    service = module.get<GroupCircleService>(GroupCircleService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("sendMessage", () => {
    it("should call service.sendMessage", async () => {
      const dto: SendMessageDto = { content: "test" };
      const business = { id: "bus1" } as Business;
      const circleId = "circle1";

      await controller.sendMessage(circleId, dto, business);
      expect(service.sendMessage).toHaveBeenCalledWith(circleId, dto, business);
    });
  });

  describe("getMessages", () => {
    it("should call service.getMessages with correct params", async () => {
      const business = { id: "bus1" } as Business;
      const circleId = "circle1";

      await controller.getMessages(
        circleId,
        business,
        2,
        10,
        GroupMessageType.GROUP,
        "mem1",
      );
      expect(service.getMessages).toHaveBeenCalledWith(
        circleId,
        "bus1",
        2,
        10,
        GroupMessageType.GROUP,
        "mem1",
      );
    });

    it("should use default params", async () => {
      const business = { id: "bus1" } as Business;
      const circleId = "circle1";

      await controller.getMessages(circleId, business);
      expect(service.getMessages).toHaveBeenCalledWith(
        circleId,
        "bus1",
        1,
        20,
        undefined,
        undefined,
      );
    });
  });
});
