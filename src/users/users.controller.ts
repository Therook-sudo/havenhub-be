import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "../entities/User.entity";

@ApiTags("Auth & Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
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
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get Current Authenticated User Profile' })
  @ApiResponse({ status: 200, description: 'Returns authenticated user profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@CurrentUser() user: User) {
    return user;
  }
}
