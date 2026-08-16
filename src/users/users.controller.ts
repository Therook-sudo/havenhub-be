import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService
  ) { }
  
  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.register(registerUserDto)
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.login(loginUserDto)
  }

  @ApiBearerAuth()
  @Get('me')
  async getMe(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      throw new UnauthorizedException('Not authenticated')
    }

    try {
      const payload = await this.jwtService.verifyAsync(token)

      return this.usersService.getMe(payload.sub)
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
