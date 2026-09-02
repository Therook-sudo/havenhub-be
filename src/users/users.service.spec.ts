import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/User.entity';
import { UsersService } from './users.service';
import { Role } from '../entities/enums';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let jwtService: any;

  beforeEach(async () => {
    userRepository = {
      create: jest.fn((dto) => ({ id: 'user-uuid-1', ...dto, createdAt: new Date() })),
      save: jest.fn((user) => Promise.resolve(user)),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('persists selected role and returns token, role, and user profile', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const dto = {
        email: 'landlord@havenhub.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.LANDLORD,
      };

      const result = await service.register(dto);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'landlord@havenhub.com',
          role: Role.LANDLORD,
        }),
      );
      expect(result.role).toBe(Role.LANDLORD);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.role).toBe(Role.LANDLORD);
      expect(result.userInfo.role).toBe(Role.LANDLORD);
    });
  });

  describe('login', () => {
    it('returns token, role, and user profile on successful authentication', async () => {
      const hash = await bcrypt.hash('Password123!', 10);
      userRepository.findOne.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'landlord@havenhub.com',
        passwordHash: hash,
        firstName: 'John',
        lastName: 'Doe',
        role: Role.LANDLORD,
        isVerified: true,
      });

      const result = await service.login({
        email: 'landlord@havenhub.com',
        password: 'Password123!',
      });

      expect(result.role).toBe(Role.LANDLORD);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('landlord@havenhub.com');
    });
  });
});
