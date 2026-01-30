# Kiểm tra Cấu hình Port - Tổng hợp

## Quy ước đặt tên (tránh nhầm host port vs container/connection port)

| Loại | Biến | Ý nghĩa | Dùng ở đâu |
|------|------|---------|------------|
| **Host port** (port trên máy host) | `APP_HOST_PORT`, `POSTGRES_HOST_PORT`, `REDIS_HOST_PORT`, `PGADMIN_HOST_PORT` | Port bên trái trong mapping `HOST:CONTAINER` | Chỉ trong **docker-compose** (port mapping) |
| **Container / connection port** | `PORT`, `DB_PORT`, `REDIS_PORT`, `APP_PORT` | Port app **lắng nghe** hoặc **kết nối tới** service | **App** (configuration.ts, env khi chạy local); **docker-compose** set cứng cho container |

- **Trong Docker**: App nhận `PORT=3000`, `DB_PORT=5432`, `REDIS_PORT=6379` từ docker-compose (port **trong** mạng container).
- **Chạy local**: App đọc `.env` → `APP_PORT=3000` (listen), `DB_PORT=5432`, `REDIS_PORT=6380` (= `REDIS_HOST_PORT`, kết nối tới Redis qua host).

---

## Cấu hình hiện tại

### 1. Docker Compose (`docker-compose.yml`)

```yaml
# Port mapping: *_HOST_PORT (host) : port cố định (container)
ports:
  - "${APP_HOST_PORT:-3001}:3000"      # app
  - "${POSTGRES_HOST_PORT:-5432}:5432" # postgres
  - "${REDIS_HOST_PORT:-6380}:6379"    # redis
  - "${PGADMIN_HOST_PORT:-5050}:80"    # pgadmin

# App container: port listen + kết nối (container-internal)
environment:
  PORT: 3000
  DB_HOST: postgres
  DB_PORT: 5432
  REDIS_HOST: redis
  REDIS_PORT: 6379
```

- Host port lấy từ `.env` (`*_HOST_PORT`).
- Port trong container cố định (3000, 5432, 6379, 80).

### 2. Environment Variables (`.env`)

#### Docker port mapping (chỉ dùng trong docker-compose)

```env
APP_HOST_PORT=3001
POSTGRES_HOST_PORT=5432
REDIS_HOST_PORT=6380
PGADMIN_HOST_PORT=5050
```

#### App / service connection (app đọc khi chạy local)

```env
APP_PORT=3000          # port app lắng nghe (local)
DB_HOST=postgres
DB_PORT=5432           # port kết nối DB (local = POSTGRES_HOST_PORT)
REDIS_HOST=redis
REDIS_PORT=6380        # port kết nối Redis (local = REDIS_HOST_PORT)
```

- Trong Docker: app **không** dùng `*_HOST_PORT`; docker-compose set `DB_PORT=5432`, `REDIS_PORT=6379` cho container.

### 3. Configuration (`src/config/configuration.ts`)

- App đọc `PORT` (Docker) hoặc `APP_PORT` (local) cho port lắng nghe.
- App đọc `DB_HOST`, `DB_PORT` và `REDIS_HOST`, `REDIS_PORT` để kết nối DB/Redis.

### 4. Validation Schema (`src/config/validation.schema.ts`)

- `APP_HOST_PORT`, `POSTGRES_HOST_PORT`, `REDIS_HOST_PORT`, `PGADMIN_HOST_PORT`: optional (dùng bởi docker-compose).
- `APP_PORT`, `DB_PORT`, `REDIS_PORT`: dùng bởi app (listen / connection port).

---

## Tóm tắt

| File | Biến host port | Biến connection/listen port |
|------|----------------|------------------------------|
| **docker-compose** | `APP_HOST_PORT`, `POSTGRES_HOST_PORT`, `REDIS_HOST_PORT`, `PGADMIN_HOST_PORT` | Trong container: `PORT=3000`, `DB_PORT=5432`, `REDIS_PORT=6379` (hardcode) |
| **.env** | Cùng các `*_HOST_PORT` ở trên | `APP_PORT`, `DB_PORT`, `REDIS_PORT` (cho app chạy local) |

- Không dùng chung một biến vừa cho host port vừa cho connection port → tránh nhầm giữa local và Docker.
