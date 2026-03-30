import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import { PaginationMetaDto } from '../../../shared/pagination/pagination.dto';

export class UsersListResponseDto {
  @ApiProperty({ type: [UserResponseDto], description: 'Danh sách users' })
  data: UserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Thông tin phân trang' })
  meta: PaginationMetaDto;
}
