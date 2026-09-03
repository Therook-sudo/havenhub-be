import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/User.entity';
import { UsersService } from './users.service';
import { Role } from '../entities/enums';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let jwtService: any;
  let cloudinaryService: any;

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

    cloudinaryService = {
      uploadImage: jest.fn().mockResolvedValue('https://res.cloudinary.com/avatar.jpg'),
      uploadImages: jest.fn().mockResolvedValue(['https://res.cloudinary.com/avatar.jpg']),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        { provide: JwtService, useValue: jwtService },
        { provide: CloudinaryService, useValue: cloudinaryService },
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

  describe('updateProfile', () => {
    it('updates user role and returns fresh JWT token with updated role', async () => {
      const existing = {
        id: 'user-uuid-1',
        email: 'seeker@havenhub.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: Role.PROPERTY_SEEKER,
        passwordHash: 'hash',
      };
      userRepository.findOne.mockResolvedValue(existing);

      const result = await service.updateProfile('user-uuid-1', {
        role: Role.LANDLORD,
      });

      expect(result.role).toBe(Role.LANDLORD);
      expect(result.token).toBe('mock-jwt-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.LANDLORD }),
      );
    });
  });

  describe('uploadAvatar', () => {
    it('uploads avatar to cloudinary and updates user avatarUrl', async () => {
      const existing = {
        id: 'user-uuid-1',
        email: 'seeker@havenhub.com',
        firstName: 'Jane',
        lastName: 'Doe',
        avatarUrl: null,
        passwordHash: 'hash',
      };
      userRepository.findOne.mockResolvedValue(existing);

      const mockFile = { buffer: Buffer.from('photo'), mimetype: 'image/png', originalname: 'avatar.png' };
      const result = await service.uploadAvatar('user-uuid-1', mockFile);

      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(mockFile);
      expect(result.success).toBe(true);
      expect(result.avatarUrl).toBe('https://res.cloudinary.com/avatar.jpg');
    });
  });

  describe('changePassword', () => {
    it('updates user password when current password matches', async () => {
      const hash = await bcrypt.hash('OldPassword123!', 10);
      const existing = {
        id: 'user-uuid-1',
        email: 'user@havenhub.com',
        passwordHash: hash,
      };
      userRepository.findOne.mockResolvedValue(existing);

      const result = await service.changePassword('user-uuid-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewSecurePassword123!',
      });

      expect(result.success).toBe(true);
      expect(userRepository.save).toHaveBeenCalled();
    });
  });
});
