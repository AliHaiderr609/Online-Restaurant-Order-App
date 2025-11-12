import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmailOrPhone(email?: string, phoneNumber?: string): Promise<User | null> {
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

  async addToken(userId: string, token: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let tokens: string[] = [];
    if (user.tokens) {
      try {
        tokens = JSON.parse(user.tokens);
      } catch (e) {
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

  async removeToken(userId: string, token: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tokens) {
      try {
        let tokens: string[] = JSON.parse(user.tokens);
        tokens = tokens.filter((t) => t !== token);
        user.tokens = JSON.stringify(tokens);
        await this.userRepository.save(user);
      } catch (e) {
        
      }
    }
  }

  async setAdminStatus(userId: string, isAdmin: boolean): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isAdmin = isAdmin;
    return this.userRepository.save(user);
  }
}

