import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, name } = signUpDto;
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.create({
      email,
      password: hashedPassword,
      name,
    });
    const tokens = await this.generateTokens(user);
    return { user, ...tokens };
  }

  async signIn(user: any) {
    const payload = { email: user.email, sub: user._id };
    const tokens = this.generateTokens(user);
    return tokens;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const tokens = await this.generateTokens(user);
      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  private generateTokens(user: any) {
    const userObject = user.toObject ? user.toObject() : user;
    const payload = { 
      sub: userObject._id.toString(),
      email: userObject.email,
      name: userObject.name
    };
    const jwtExpiration = this.configService.get<string>('JWT_EXPIRATION', '1h');
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: jwtExpiration,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });
    return { 
      access_token: accessToken, 
      refresh_token: refreshToken,
      expires_in: jwtExpiration,
      token_type: 'bearer'
    };
  }

  async login(user: any) {
    const payload = { sub: user._id, email: user.email };
    const expiresIn = this.configService.get<number>('JWT_EXPIRATION');
    const token = this.jwtService.sign(payload, { expiresIn });
    return {
      access_token: token,
    };
  }
}
