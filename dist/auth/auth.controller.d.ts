import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { PromoteAdminDto } from './dto/promote-admin.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    promoteToAdmin(promoteAdminDto: PromoteAdminDto): Promise<void>;
}
