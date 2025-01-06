import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schema';
import * as jwt from 'jsonwebtoken';
import { CreateUserDto } from './dto/create-user.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  // Hard-coded secret for demo; in production, use process.env.JWT_SECRET
  private readonly JWT_SECRET = 'MY_SUPER_SECRET';
  private readonly EXPIRES_IN = '5m';
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>
  ) {}
  async createUser(dto: CreateUserDto): Promise<User> {
    // Ensure email is unique
    const existing = await this.userModel.findOne({ email: dto.email }).exec();
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // If no apiKey was provided, generate one
    let apiKey = dto.apiKey;
    if (!apiKey) {
      apiKey = this.generateApiKey();
    }

    // Convert apiKeyExpiresAt string to Date if provided
    let apiKeyExpiresAt = null;
    if (dto.apiKeyExpiresAt) {
      apiKeyExpiresAt = new Date(dto.apiKeyExpiresAt);
    }

    const user = new this.userModel({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      apiKey,
      apiKeyExpiresAt,
      roles: dto.roles || [],
      permissionMatrix: dto.permissionMatrix || {},
      usageCounters: dto.usageCounters || {},
    });

    return user.save();
  }

  // Generate a random API key
  private generateApiKey(): string {
    const rand = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `KEY_${rand}`;
  }

  /**
   * Return all users (demo).
   * In production, you might want to remove passwords or filter data.
   */
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(
    id: string,
    updateDto: { name?: string; email?: string; age?: number }
  ) {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found or update failed');
    }
    return user;
  }

  async deleteUser(id: string) {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found or delete failed');
    }
    return result;
  }

  async findByUsername(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async validateUser(username: string, password: string) {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }
    if (user.password !== password) {
      throw new UnauthorizedException('Invalid password');
    }
    return user;
  }

  // Generate a JWT for the authenticated user
  async generateToken(user: any) {
    // user could have _id, username, roles, etc.
    const payload = {
      userId: user._id,
      username: user.username,
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.EXPIRES_IN });
  }

  async findApiKey(apiKey: string): Promise<User | null> {
    const user = await this.userModel.findOne({ apiKey }).exec();
    if (!user) {
      throw new NotFoundException('User with the provided API key not found');
    }
    return user;
  }

  async updateUserUsage(
    userId: string,
    data: {
      usageCounters: Record<string, number>;
      permissionMatrix?: Record<string, any>;
    }
  ): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update usage counters
    user.usageCounters = {
      ...user.usageCounters, // Preserve existing usageCounters
      ...data.usageCounters, // Merge with incoming updates
    };

    // Update permissionMatrix (if provided)
    if (data.permissionMatrix) {
      user.permissionMatrix = {
        ...user.permissionMatrix, // Preserve existing matrix
        ...data.permissionMatrix, // Merge with incoming updates
      };
    }

    return user.save(); // Persist changes to the database
  }
}
