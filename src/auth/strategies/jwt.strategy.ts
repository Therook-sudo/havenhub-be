import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/User.entity';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const flexibleBearerExtractor = (req: Request): string | null => {
  if (!req || !req.headers) return null;
  const rawHeader = req.headers.authorization || (req.headers as any).Authorization;
  if (!rawHeader) return null;

  let token = rawHeader.trim();
  while (token.toLowerCase().startsWith('bearer ')) {
    token = token.substring(7).trim();
  }
  return token || null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'havenhub_dev_secret_key_2026';

    super({
      jwtFromRequest: flexibleBearerExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    const { passwordHash, ...result } = user;
    return result; // becomes req.user
  }
}