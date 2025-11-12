"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
const otp_entity_1 = require("./entities/otp.entity");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, otpRepository) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.otpRepository = otpRepository;
    }
    async register(registerDto) {
        const { email, phoneNumber, password, name } = registerDto;
        const existingUser = await this.usersService.findByEmailOrPhone(email, phoneNumber);
        if (existingUser) {
            if (existingUser.email === email) {
                throw new common_1.ConflictException('User with this email already exists');
            }
            if (existingUser.phoneNumber === phoneNumber) {
                throw new common_1.ConflictException('User with this phone number already exists');
            }
            throw new common_1.ConflictException('User with this email or phone number already exists');
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
        }
        catch (error) {
            if (error instanceof typeorm_2.QueryFailedError) {
                const errorMessage = error.message;
                if (errorMessage.includes('email') || errorMessage.includes('UQ_')) {
                    throw new common_1.ConflictException('User with this email already exists');
                }
                if (errorMessage.includes('phoneNumber')) {
                    throw new common_1.ConflictException('User with this phone number already exists');
                }
                throw new common_1.ConflictException('User with this email or phone number already exists');
            }
            throw error;
        }
    }
    async login(loginDto) {
        const { email, phoneNumber, password } = loginDto;
        if (!email && !phoneNumber) {
            throw new common_1.BadRequestException('Email or phone number is required');
        }
        const user = await this.usersService.findByEmailOrPhone(email, phoneNumber);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
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
    }
    async requestOtp(otpRequestDto) {
        const { email, phoneNumber } = otpRequestDto;
        if (!email && !phoneNumber) {
            throw new common_1.BadRequestException('Email or phone number is required');
        }
        const user = await this.usersService.findByEmailOrPhone(email, phoneNumber);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        const identifier = email || phoneNumber;
        await this.otpRepository.update({ identifier, isUsed: false }, { isUsed: true });
        await this.otpRepository.save({
            identifier,
            otp,
            expiresAt,
            isUsed: false,
        });
        return {
            message: 'OTP sent successfully',
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        };
    }
    async verifyOtp(otpVerifyDto) {
        const { email, phoneNumber, otp } = otpVerifyDto;
        if (!email && !phoneNumber) {
            throw new common_1.BadRequestException('Email or phone number is required');
        }
        const identifier = email || phoneNumber;
        const otpRecord = await this.otpRepository.findOne({
            where: {
                identifier,
                otp,
                isUsed: false,
            },
            order: { createdAt: 'DESC' },
        });
        if (!otpRecord) {
            throw new common_1.UnauthorizedException('Invalid OTP');
        }
        if (new Date() > otpRecord.expiresAt) {
            throw new common_1.UnauthorizedException('OTP has expired');
        }
        await this.otpRepository.update({ id: otpRecord.id }, { isUsed: true });
        const user = await this.usersService.findByEmailOrPhone(email, phoneNumber);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
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
    }
    async promoteToAdmin(userId, secretKey) {
        const adminSecret = this.configService.get('ADMIN_SECRET_KEY');
        if (!adminSecret || adminSecret !== secretKey) {
            throw new common_1.UnauthorizedException('Invalid admin secret key');
        }
        await this.usersService.setAdminStatus(userId, true);
    }
    generateToken(userId) {
        const payload = { sub: userId };
        const expiresIn = this.configService.get('JWT_EXPIRES_IN', '7d');
        return this.jwtService.sign(payload, {
            expiresIn: expiresIn,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(otp_entity_1.Otp)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map