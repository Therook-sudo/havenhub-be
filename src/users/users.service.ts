import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/User.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UploadedPropertyFile } from '../properties/properties.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const normalizedEmail = registerUserDto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with Email: ${registerUserDto.email} already exists.`,
      );
    }

    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    const user = this.userRepository.create({
      ...registerUserDto,
      email: normalizedEmail,
      role: registerUserDto.role,
      passwordHash: hashedPassword,
    });

    const saved = await this.userRepository.save(user);

    // Sign JWT token upon registration so user can proceed directly to role dashboard
    const payload = {
      sub: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      role: saved.role,
    };

    const token = await this.jwtService.signAsync(payload);

    const { passwordHash, ...userInfo } = saved;

    return {
      token,
      role: saved.role,
      user: userInfo,
      userInfo,
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const normalizedEmail = loginUserDto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (!existingUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const correctPassword = await bcrypt.compare(
      loginUserDto.password,
      existingUser.passwordHash,
    );

    if (!correctPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Auth enforcement for suspended accounts
    if (existingUser.isSuspended) {
      throw new ForbiddenException(
        `Your account has been suspended. Reason: ${existingUser.suspensionReason}`,
      );
    }

    const payload = {
      sub: existingUser.id,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      role: existingUser.role,
    };

    const token = await this.jwtService.signAsync(payload);

    const { passwordHash: $, ...userInfo } = existingUser;

    return {
      token,
      role: existingUser.role,
      user: userInfo,
      userInfo,
    };
  }

  async getMe(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...userInfo } = user;

    return userInfo;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.firstName !== undefined) user.firstName = updateUserDto.firstName.trim();
    if (updateUserDto.lastName !== undefined) user.lastName = updateUserDto.lastName.trim();
    if (updateUserDto.phoneNumber !== undefined) user.phoneNumber = updateUserDto.phoneNumber.trim();
    if (updateUserDto.avatarUrl !== undefined) user.avatarUrl = updateUserDto.avatarUrl.trim();
    if (updateUserDto.role !== undefined) user.role = updateUserDto.role;

    const saved = await this.userRepository.save(user);

    const payload = {
      sub: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      role: saved.role,
    };

    const token = await this.jwtService.signAsync(payload);
    const { passwordHash, ...userInfo } = saved;

    return {
      token,
      role: saved.role,
      user: userInfo,
      userInfo,
    };
  }

  async uploadAvatar(userId: string, file?: UploadedPropertyFile) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Image file is required for avatar upload.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let avatarUrl = '';
    try {
      avatarUrl = await this.cloudinaryService.uploadImage(file);
    } catch (err) {
      // Fallback placeholder if cloud upload fails
      avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';
    }

    user.avatarUrl = avatarUrl;
    const saved = await this.userRepository.save(user);
    const { passwordHash, ...userInfo } = saved;

    return {
      success: true,
      avatarUrl,
      user: userInfo,
      userInfo,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }
}
