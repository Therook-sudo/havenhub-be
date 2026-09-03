import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/User.entity';
import { UploadedPropertyFile } from '../properties/properties.service';

@ApiTags('Auth & Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register User Account' })
  @ApiResponse({
    status: 201,
    description:
      'User account created successfully, returns JWT token and user info',
  })
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.register(registerUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User Login' })
  @ApiResponse({
    status: 201,
    description: 'Login successful, returns JWT token and user info',
  })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.login(loginUserDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get Current Authenticated User Profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns authenticated user profile',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@CurrentUser() user: User) {
    return user;
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiOperation({
    summary: 'Update Current Authenticated User Profile (e.g. Role Selection)',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiOperation({ summary: 'Put Current Authenticated User Profile (Me)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async putMe(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put()
  @ApiOperation({
    summary: 'Update Current Authenticated User Profile (Alias)',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfileRoot(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiOperation({ summary: 'Patch Current Authenticated User Profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async patchProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Patch Current Authenticated User Profile (Me)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async patchMe(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  // --- Photo / Avatar Upload Endpoints ---

  @Post('me/photo')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload User Profile Photo (avatar)' })
  @ApiResponse({ status: 200, description: 'Photo uploaded and avatarUrl updated successfully' })
  async uploadPhoto(
    @CurrentUser() user: User,
    @UploadedFiles() files: Array<UploadedPropertyFile>,
  ) {
    const file = files && files.length > 0 ? files[0] : undefined;
    return this.usersService.uploadAvatar(user.id, file);
  }

  @Post('photo')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload User Profile Photo (Alias)' })
  async uploadPhotoAlias(
    @CurrentUser() user: User,
    @UploadedFiles() files: Array<UploadedPropertyFile>,
  ) {
    const file = files && files.length > 0 ? files[0] : undefined;
    return this.usersService.uploadAvatar(user.id, file);
  }

  @Post('me/avatar')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload User Avatar' })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFiles() files: Array<UploadedPropertyFile>,
  ) {
    const file = files && files.length > 0 ? files[0] : undefined;
    return this.usersService.uploadAvatar(user.id, file);
  }

  // --- Password Change Endpoints ---

  @Put('me/password')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change Password for Authenticated User' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Put('change-password')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change Password (Alias)' })
  async changePasswordAlias(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }
}
