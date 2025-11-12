import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { Otp } from './entities/otp.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, phoneNumber, password, name } = registerDto;

    const existingUser = await this.usersService.findByEmailOrPhone(email, phoneNumber);
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.phoneNumber === phoneNumber) {
        throw new ConflictException('User with this phone number already exists');
      }
      throw new ConflictException('User with this email or phone number already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.usersService.create({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
      });

      const token = this.generateToken(user.id);

      await this.usersService.addToken(user.id, token);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
        token,
      };
    } catch (error) {
    
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message;
        if (errorMessage.includes('email') || errorMessage.includes('UQ_')) {
          throw new ConflictException('User with this email already exists');
        }
        if (errorMessage.includes('phoneNumber')) {
          throw new ConflictException('User with this phone number already exists');
        }
        throw new ConflictException('User with this email or phone number already exists');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, phoneNumber, password } = loginDto;

    if (!email && !phoneNumber) {
      throw new BadRequestException('Email or phone number is required');
    }

    const user = await this.usersService.findByEmailOrPhone(email, phoneNumber);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Store token in user's tokens array
    await this.usersService.addToken(user.id, token);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      token,
    };
  }

  async requestOtp(otpRequestDto: OtpRequestDto) {
    const { email, phoneNumber } = otpRequestDto;

    if (!email && !phoneNumber) {
      throw new BadRequestException('Email or phone number is required');
    }

    // Check if user exists
    const user = await this.usersService.findByEmailOrPhone(email, phoneNumber);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 5 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Invalidate previous OTPs for this identifier
    const identifier = email || phoneNumber;
    await this.otpRepository.update(
      { identifier, isUsed: false },
      { isUsed: true },
    );

    // Save new OTP
    await this.otpRepository.save({
      identifier,
      otp,
      expiresAt,
      isUsed: false,
    });

    return {
      message: 'OTP sent successfully',
      // Remove this in production
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  async verifyOtp(otpVerifyDto: OtpVerifyDto) {
    const { email, phoneNumber, otp } = otpVerifyDto;

    if (!email && !phoneNumber) {
      throw new BadRequestException('Email or phone number is required');
    }

    const identifier = email || phoneNumber;

    // Find valid OTP
    const otpRecord = await this.otpRepository.findOne({
      where: {
        identifier,
        otp,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Mark OTP as used
    await this.otpRepository.update({ id: otpRecord.id }, { isUsed: true });

    // Find user
    const user = await this.usersService.findByEmailOrPhone(email, phoneNumber);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Store token in user's tokens array
    await this.usersService.addToken(user.id, token);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      token,
    };
  }

  async promoteToAdmin(userId: string, secretKey: string): Promise<void> {
    const adminSecret = this.configService.get<string>('ADMIN_SECRET_KEY');
    if (!adminSecret || adminSecret !== secretKey) {
      throw new UnauthorizedException('Invalid admin secret key');
    }

      await this.usersService.setAdminStatus(userId, true);
  }

  private generateToken(userId: string): string {
    const payload = { sub: userId };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    return this.jwtService.sign(payload, {
      expiresIn: expiresIn as any,
    });
  }
}

