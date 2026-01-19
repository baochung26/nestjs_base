# Hướng dẫn sử dụng pgAdmin

pgAdmin là công cụ quản lý PostgreSQL database được tích hợp vào Docker Compose để giúp bạn quản lý database một cách trực quan và dễ dàng.

## 📋 Mục lục

- [Truy cập pgAdmin](#truy-cập-pgadmin)
- [Kết nối với PostgreSQL Server](#kết-nối-với-postgresql-server)
- [Sử dụng pgAdmin](#sử-dụng-pgadmin)
- [Cấu hình](#cấu-hình)
- [Troubleshooting](#troubleshooting)

## 🚀 Truy cập pgAdmin

### Bước 1: Khởi động services

Đảm bảo tất cả services đã được khởi động:

```bash
docker-compose up -d
```

Kiểm tra pgAdmin đã chạy:

```bash
docker-compose ps
```

Bạn sẽ thấy container `nestjs_pgadmin` đang chạy.

### Bước 2: Mở pgAdmin trong trình duyệt

Truy cập: **http://localhost:5050** (hoặc port bạn đã cấu hình trong `PGADMIN_PORT`)

### Bước 3: Đăng nhập

- **Email:** `admin@admin.com` (hoặc giá trị trong biến môi trường `PGADMIN_EMAIL`)
- **Password:** `admin` (hoặc giá trị trong biến môi trường `PGADMIN_PASSWORD`)

## 🔌 Kết nối với PostgreSQL Server

Sau khi đăng nhập, bạn cần kết nối với PostgreSQL server:

### Cách 1: Kết nối thủ công

1. **Click chuột phải** vào **Servers** ở panel bên trái
2. Chọn **Register** → **Server**

3. **Tab General:**
   - **Name:** `NestJS PostgreSQL` (hoặc tên bạn muốn)

4. **Tab Connection:**
   - **Host name/address:** `postgres` ⚠️ **Quan trọng:** Sử dụng tên service trong docker-compose, không phải `localhost`
   - **Port:** `5432`
   - **Maintenance database:** `nestjs_db` (hoặc giá trị trong `DB_NAME`)
   - **Username:** `postgres` (hoặc giá trị trong `DB_USER`)
   - **Password:** `postgres` (hoặc giá trị trong `DB_PASSWORD`)
   - ✅ **Check "Save password"** để lưu mật khẩu (không cần nhập lại mỗi lần)

5. **Tab Advanced (Tùy chọn):**
   - Có thể để mặc định

6. Click **Save**

### Cách 2: Import server configuration (Nâng cao)

Bạn có thể tạo file JSON để import server configuration:

```json
{
  "Servers": {
    "1": {
      "Name": "NestJS PostgreSQL",
      "Group": "Servers",
      "Host": "postgres",
      "Port": 5432,
      "MaintenanceDB": "nestjs_db",
      "Username": "postgres",
      "Password": "postgres",
      "SSLMode": "prefer"
    }
  }
}
```

Import qua: **File** → **Preferences** → **Servers** → **Import/Export**

## 💡 Sử dụng pgAdmin

### Xem Databases

1. Mở rộng **Servers** → **NestJS PostgreSQL** → **Databases**
2. Click vào database `nestjs_db` để xem các tables

### Xem và Quản lý Tables

1. Mở rộng database → **Schemas** → **public** → **Tables**
2. Click chuột phải vào table để:
   - **View/Edit Data** → Xem và chỉnh sửa dữ liệu
   - **Properties** → Xem thông tin table
   - **Scripts** → Tạo SQL scripts (CREATE, SELECT, INSERT, UPDATE, DELETE)
   - **Truncate** → Xóa tất cả dữ liệu trong table
   - **Drop** → Xóa table

### Chạy SQL Queries

1. Click vào database `nestjs_db`
2. Click vào icon **Query Tool** (hoặc **Tools** → **Query Tool**)
3. Viết SQL query và click **Execute** (F5)

**Ví dụ:**

```sql
-- Xem tất cả users
SELECT * FROM "user";

-- Xem users với role admin
SELECT * FROM "user" WHERE role = 'admin';

-- Đếm số lượng users
SELECT COUNT(*) FROM "user";
```

### Export/Import Data

#### Export Data:

1. Click chuột phải vào table
2. Chọn **Backup...**
3. Chọn file path và format (SQL, CSV, etc.)
4. Click **Backup**

#### Import Data:

1. Click chuột phải vào database hoặc table
2. Chọn **Restore...** hoặc **Import/Export...**
3. Chọn file và click **Restore** hoặc **Import**

### Xem Schema

1. Mở rộng **Schemas** → **public** → **Tables**
2. Click vào table để xem:
   - **Columns:** Danh sách các cột và kiểu dữ liệu
   - **Constraints:** Primary keys, Foreign keys, Unique constraints
   - **Indexes:** Các indexes
   - **Triggers:** Database triggers

### Tạo và Quản lý Users/Roles

1. Mở rộng **Login/Group Roles**
2. Click chuột phải để tạo role mới
3. Cấu hình permissions và privileges

## ⚙️ Cấu hình

### Thay đổi Port

Cập nhật trong file `.env`:

```env
PGADMIN_PORT=8080  # Thay đổi port nếu cần
```

Sau đó restart:

```bash
docker-compose restart pgadmin
```

### Thay đổi Email/Password

Cập nhật trong file `.env`:

```env
PGADMIN_EMAIL=your-email@example.com
PGADMIN_PASSWORD=your-strong-password
```

Sau đó restart:

```bash
docker-compose restart pgadmin
```

**⚠️ Lưu ý:** Nếu bạn thay đổi password, bạn sẽ cần đăng nhập lại với password mới.

### Persistent Storage

Dữ liệu pgAdmin (server configurations, saved queries, etc.) được lưu trong Docker volume `pgadmin_data`. Điều này có nghĩa là:

- Các cấu hình server sẽ được giữ lại khi restart container
- Nếu xóa volume, bạn sẽ mất tất cả cấu hình

Xem volumes:

```bash
docker volume ls | grep pgadmin
```

Xóa volume (⚠️ Mất tất cả cấu hình):

```bash
docker-compose down -v
```

## 🔧 Troubleshooting

### pgAdmin không khởi động

Kiểm tra logs:

```bash
docker-compose logs pgadmin
```

Kiểm tra port đã được sử dụng:

```bash
netstat -tuln | grep 5050
# hoặc
lsof -i :5050
```

Nếu port đã được sử dụng, thay đổi `PGADMIN_PORT` trong `.env`.

### Không thể kết nối với PostgreSQL

1. **Kiểm tra PostgreSQL đang chạy:**
   ```bash
   docker-compose ps postgres
   ```

2. **Kiểm tra network:**
   Đảm bảo cả `postgres` và `pgadmin` đều trong cùng network `nestjs_network`

3. **Kiểm tra hostname:**
   Trong Docker Compose, sử dụng tên service `postgres` làm hostname, không phải `localhost` hoặc `127.0.0.1`

4. **Kiểm tra credentials:**
   Đảm bảo username và password khớp với giá trị trong `.env`:
   - `DB_USER` và `DB_PASSWORD`

### Quên mật khẩu pgAdmin

Reset bằng cách xóa volume và tạo lại:

```bash
docker-compose down
docker volume rm nestjs_use_cursor_demo_pgadmin_data
docker-compose up -d
```

Sau đó đăng nhập với mật khẩu mặc định hoặc mật khẩu trong `.env`.

### pgAdmin chạy chậm

1. Kiểm tra tài nguyên hệ thống:
   ```bash
   docker stats
   ```

2. Tăng memory limit cho container (nếu cần) trong `docker-compose.yml`:
   ```yaml
   pgadmin:
     # ... existing config ...
     deploy:
       resources:
         limits:
           memory: 512M
   ```

## 📚 Tài liệu tham khảo

- [pgAdmin Official Documentation](https://www.pgadmin.org/docs/)
- [pgAdmin Docker Image](https://hub.docker.com/r/dpage/pgadmin4/)

## 💡 Tips

1. **Lưu queries thường dùng:** Sử dụng **Query History** hoặc tạo **Query Tool** và save queries
2. **Keyboard Shortcuts:** Sử dụng F5 để execute query, Ctrl+Space để autocomplete
3. **Multiple Connections:** Bạn có thể kết nối nhiều PostgreSQL servers cùng lúc
4. **Dark Mode:** pgAdmin có dark mode trong Settings → Preferences → Miscellaneous → Theme
