import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { UpdateUserDto } from '../../user/dto/update-user.dto';
import { CreateUserDto } from '../../user/dto/create-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private userService: UserService) {}

  async getAllUsers() {
    return this.userService.findAll();
  }

  async getUserById(id: string) {
    return this.userService.findOne(id);
  }

  async createUser(createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  async deleteUser(id: string) {
    return this.userService.remove(id);
  }

  async activateUser(id: string) {
    return this.userService.update(id, { isActive: true });
  }

  async deactivateUser(id: string) {
    return this.userService.update(id, { isActive: false });
  }
}
