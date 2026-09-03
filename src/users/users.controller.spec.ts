import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '../entities/enums';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: any;

  beforeEach(async () => {
    usersService = {
      register: jest.fn(),
      login: jest.fn(),
      updateProfile: jest.fn(),
      uploadAvatar: jest.fn(),
      changePassword: jest.fn(),
      getMe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('updates user profile role via PUT /users/profile', async () => {
    const mockUser = { id: 'user-uuid-1', email: 'test@havenhub.com', role: Role.PROPERTY_SEEKER } as any;
    const dto = { role: Role.LANDLORD };
    usersService.updateProfile.mockResolvedValue({
      token: 'jwt-token',
      role: Role.LANDLORD,
      user: { ...mockUser, role: Role.LANDLORD },
      userInfo: { ...mockUser, role: Role.LANDLORD },
    });

    const result = await controller.updateProfile(mockUser, dto);
    expect(usersService.updateProfile).toHaveBeenCalledWith('user-uuid-1', dto);
    expect(result.role).toBe(Role.LANDLORD);
  });

  it('uploads avatar via POST /users/me/photo', async () => {
    const mockUser = { id: 'user-uuid-1' } as any;
    const mockFile = { buffer: Buffer.from('test'), mimetype: 'image/png', originalname: 'avatar.png' };
    usersService.uploadAvatar.mockResolvedValue({
      success: true,
      avatarUrl: 'https://cloudinary.com/avatar.png',
    });

    const result = await controller.uploadPhoto(mockUser, [mockFile]);
    expect(usersService.uploadAvatar).toHaveBeenCalledWith('user-uuid-1', mockFile);
    expect(result.success).toBe(true);
  });
});
