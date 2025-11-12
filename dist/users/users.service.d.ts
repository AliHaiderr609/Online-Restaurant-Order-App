import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(userData: Partial<User>): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmailOrPhone(email?: string, phoneNumber?: string): Promise<User | null>;
    addToken(userId: string, token: string): Promise<void>;
    removeToken(userId: string, token: string): Promise<void>;
    setAdminStatus(userId: string, isAdmin: boolean): Promise<User>;
}
