import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard cho Google OAuth.
 * getAuthenticateOptions() trả về prompt: 'select_account' để mỗi lần đăng nhập
 * Google đều hiện trang chọn tài khoản (tránh tự động dùng tài khoản đã đăng xuất).
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(): object {
    return {
      prompt: 'select_account',
    };
  }
}
