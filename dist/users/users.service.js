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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async create(userData) {
        const user = this.userRepository.create(userData);
        return this.userRepository.save(user);
    }
    async findById(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async findByEmailOrPhone(email, phoneNumber) {
        if (email && phoneNumber) {
            return this.userRepository.findOne({
                where: [
                    { email },
                    { phoneNumber },
                ],
            });
        }
        if (email) {
            return this.userRepository.findOne({ where: { email } });
        }
        if (phoneNumber) {
            return this.userRepository.findOne({ where: { phoneNumber } });
        }
        return null;
    }
    async addToken(userId, token) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        let tokens = [];
        if (user.tokens) {
            try {
                tokens = JSON.parse(user.tokens);
            }
            catch (e) {
                tokens = [];
            }
        }
        tokens.push(token);
        if (tokens.length > 10) {
            tokens = tokens.slice(-10);
        }
        user.tokens = JSON.stringify(tokens);
        await this.userRepository.save(user);
    }
    async removeToken(userId, token) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.tokens) {
            try {
                let tokens = JSON.parse(user.tokens);
                tokens = tokens.filter((t) => t !== token);
                user.tokens = JSON.stringify(tokens);
                await this.userRepository.save(user);
            }
            catch (e) {
            }
        }
    }
    async setAdminStatus(userId, isAdmin) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isAdmin = isAdmin;
        return this.userRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map