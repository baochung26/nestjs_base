import { UserRole } from '../entities/user.entity';

/**
 * User DTO for response (without sensitive data)
 */
export class UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
