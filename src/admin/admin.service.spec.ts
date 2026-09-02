import { Test, TestingModule } from "@nestjs/testing";
import { AdminService } from "./admin.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "@/entities/User.entity";
import { Property } from "@/entities/Property.entity";
import { Enquiry } from "@/entities/Enquiry.entity";
import { AuditLogService } from "@/audit-log/audit-log.service";

describe("AdminService", () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), 
          useValue: { count: jest.fn() } 
        },
        {
          provide: getRepositoryToken(Property),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Enquiry),
          useValue: { count: jest.fn() },
        },
        {
          provide: AuditLogService,
          useValue: { logAction: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
