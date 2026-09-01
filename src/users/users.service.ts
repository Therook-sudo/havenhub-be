import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/User.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
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
      throw new ConflictException('User not found');
    }

    const { passwordHash, ...userInfo } = user;

    return userInfo;
  }
}
