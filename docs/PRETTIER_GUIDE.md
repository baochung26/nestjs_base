# Prettier Guide

Hướng dẫn format và kiểm tra code style trong dự án NestJS này.

## Mục tiêu

- Giữ code style nhất quán cho team dùng Windows, macOS, Ubuntu.
- Giảm lỗi lint/format trước khi commit.
- Tránh lỗi line ending (`CRLF/LF`) gây đỏ hàng loạt file.

## Cấu hình đang dùng

- `.prettierrc`
  - `singleQuote: true`
  - `trailingComma: "all"`
  - `endOfLine: "auto"`
- `.editorconfig`
  - Chuẩn hóa editor về UTF-8, `LF`, indent 2 spaces.
- `.gitattributes`
  - Normalize text file về `LF` khi commit.
  - Giữ `CRLF` cho script Windows (`.bat`, `.cmd`, `.ps1`).

## Các lệnh thường dùng

### 1) Format code

```bash
npm run format
```

Script hiện tại:

```bash
prettier --write "src/**/*.ts" "test/**/*.ts"
```

### 2) Kiểm tra format (không ghi file)

```bash
npx prettier --check .
```

### 3) Kiểm tra lint + tự fix

```bash
npm run lint
```

## Quy trình trước khi commit

```bash
npm run format
npm run lint
```

Nếu có thay đổi lớn về line ending sau khi thêm `.gitattributes`, chạy 1 lần:

```bash
git add --renormalize .
```

## Gợi ý cấu hình VS Code

Tạo/cập nhật `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "files.eol": "\n"
}
```

## Lỗi thường gặp

### Lỗi `Delete ␍` (prettier/prettier)

Nguyên nhân: xung đột `CRLF/LF`.

Cách xử lý:

1. Đảm bảo đã pull các file config mới: `.prettierrc`, `.editorconfig`, `.gitattributes`.
2. Chạy:
   - `npm run format`
   - `npm run lint`
3. Nếu vẫn còn, chạy thêm: `git add --renormalize .`

### Warning TypeScript version không được @typescript-eslint support

Đây là warning tương thích phiên bản, không phải lỗi format của Prettier.

## Ghi chú

- Prettier lo phần format.
- ESLint lo quality rules và tích hợp rule Prettier trong lint output.
