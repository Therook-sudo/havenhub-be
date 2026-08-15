import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "@/entities/User.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { LoginUserDto } from "./dto/login-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private UserRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const existingUser = await this.UserRepository.findOneBy({
      email: registerUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException(
        `User with Email:${registerUserDto.email} already exists.`,
      );
    }

    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    const user = this.UserRepository.create({
      ...registerUserDto,
      passwordHash: hashedPassword,
    });

    const saved = await this.UserRepository.save(user);

    const { passwordHash, ...result } = saved;

    return result;
  }

  async login(loginUserDto: LoginUserDto) {
    const existingUser = await this.UserRepository.findOneBy({
      email: loginUserDto.email,
    });
    if (!existingUser) {
      throw new ConflictException("Invalid credentials");
    }

    const correctPassword = await bcrypt.compare(
      loginUserDto.password,
      existingUser.passwordHash,
    );

    if (!correctPassword) {
      throw new UnauthorizedException("Invalid credentials");
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
      userInfo,
    };
  }

  async getMe(id) {
    const user = await this.UserRepository.findOneBy({ id })
    if (!user) {
      throw new ConflictException('User not found')
    }

    const { passwordHash, ...userInfo } = user
    
    return userInfo
  }
}
