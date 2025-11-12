import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Otp } from './entities/otp.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private otpRepository;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, otpRepository: Repository<Otp>);
    register(registerDto: RegisterDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            phoneNumber: string;
        };
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            phoneNumber: string;
        };
        token: string;
    }>;
    requestOtp(otpRequestDto: OtpRequestDto): Promise<{
        message: string;
        otp: string;
    }>;
    verifyOtp(otpVerifyDto: OtpVerifyDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            phoneNumber: string;
        };
        token: string;
    }>;
    promoteToAdmin(userId: string, secretKey: string): Promise<void>;
    private generateToken;
}
