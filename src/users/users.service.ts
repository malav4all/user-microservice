import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schema';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UsersService {
  // Hard-coded secret for demo; in production, use process.env.JWT_SECRET
  private readonly JWT_SECRET = 'MY_SUPER_SECRET';
  private readonly EXPIRES_IN = '1d';
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>
  ) {}

  async createUser(dto: { name: string; email: string; age: number }) {
    const user = new this.userModel(dto);
    return user.save();
  }

  async findAll() {
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

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
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
}
