import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { UpdateUserDto } from '../../users/dtos/update-user.dto';
import { CreateUserDto } from '../../users/dtos/create-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private usersService: UsersService) {}

  async getAllUsers() {
    return this.usersService.findAll();
  }

  async getUserById(id: string) {
    return this.usersService.findOne(id);
  }

  async createUser(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  async deleteUser(id: string) {
    return this.usersService.remove(id);
  }

  async activateUser(id: string) {
    return this.usersService.update(id, { isActive: true });
  }

  async deactivateUser(id: string) {
    return this.usersService.update(id, { isActive: false });
  }
}
