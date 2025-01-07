import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './users.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // CREATE
  @Post()
  // @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    const user = await this.usersService.createUser(createUserDto);
    return user;
  }

  // READ ALL
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Post('login')
  async login(@Body() creds: { email: string; password: string }) {
    // Validate user (check DB)
    const user = await this.usersService.validateUser(
      creds.email,
      creds.password
    );
    // Generate JWT
    const token = await this.usersService.generateToken(user);
    return { accessToken: token };
  }

  @Get('find-by-api-key/:apiKey')
  async findByApiKey(@Param('apiKey') apiKey: string) {
    const user = await this.usersService.findApiKey(apiKey);
    return user;
  }

  @Put('update-usage/:id')
  async updateUserUsage(
    @Param('id') id: string,
    @Body()
    data: {
      usageCounters: Record<string, number>;
      permissionMatrix?: Record<string, any>; // Optional permissionMatrix updates
    }
  ) {
    return this.usersService.updateUserUsage(id, data);
  }
}
