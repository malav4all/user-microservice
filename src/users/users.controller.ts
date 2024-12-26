import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // CREATE
  @Post()
  async create(@Body() body: { name: string; email: string; age: number }) {
    return this.usersService.createUser(body);
  }

  // READ ALL
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  // READ ONE
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // UPDATE
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: { name?: string; email?: string; age?: number },
  ) {
    return this.usersService.updateUser(id, updateDto);
  }

  // DELETE
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post('login')
  async login(@Body() creds: { username: string; password: string }) {
    // Validate user (check DB)
    const user = await this.usersService.validateUser(
      creds.username,
      creds.password,
    );
    // Generate JWT
    const token = await this.usersService.generateToken(user);
    return { accessToken: token };
  }
}
