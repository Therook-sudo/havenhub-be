import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Auth & Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  
  @Post('register')
  @ApiOperation({ summary: 'Register User Account' })
  @ApiResponse({ status: 201, description: 'User account created successfully, returns JWT token and user info' })
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.register(registerUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User Login' })
  @ApiResponse({ status: 201, description: 'Login successful, returns JWT token and user info' })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.login(loginUserDto);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Get Current Authenticated User Profile' })
  @ApiResponse({ status: 200, description: 'Returns authenticated user profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@Req() req: Request) {
    const rawHeader = req.headers.authorization || '';
    let token = rawHeader.trim();

    // Flexible extraction: remove any leading "Bearer " tokens if repeated
    while (token.toLowerCase().startsWith('bearer ')) {
      token = token.substring(7).trim();
    }

    if (!token) {
      throw new UnauthorizedException('Not authenticated. Bearer token missing.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      return this.usersService.getMe(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
