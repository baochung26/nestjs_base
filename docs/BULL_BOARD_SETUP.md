# Bull Board Setup Guide

## 🎯 Tổng quan

**Bull Board** là UI dashboard để monitor và quản lý Bull queues, tương tự **Laravel Horizon**.

## 📁 Cấu trúc Code

```
src/infrastructure/queue/
├── bull-board/
│   ├── bull-board.constants.ts          # Path, header constants
│   ├── bull-board-auth.middleware.ts    # Auth middleware (secret key, timing-safe)
│   ├── bull-board-setup.service.ts      # Mount logic (auth + router)
│   ├── bull-board-unauthorized.view.ts  # HTML template cho 401
│   └── index.ts                         # Barrel exports
├── bull-board.service.ts                # Bull Board + queue adapters
├── queue.module.ts
└── ...
```

- **BullBoardSetupService**: Encapsulates việc mount UI (auth + router) vào Express
- **BullBoardService**: Khởi tạo Bull Board với các queues, đọc config từ ConfigService
- **Auth middleware**: Factory pattern, testable, nhận options hoặc ConfigService

## 📦 Cài đặt

Packages đã được thêm vào `package.json`:

```bash
npm install
```

Packages:
- `@bull-board/api` - Core API
- `@bull-board/express` - Express adapter

## 🚀 Truy cập Bull Board

### URL

```
http://localhost:3000/admin/queues
```

### Authentication (Secret Key)

Bull Board bảo vệ bằng **secret key** đặt trong `.env`. Nếu `BULL_BOARD_SECRET_KEY` trống thì không có bảo vệ.

#### Cấu hình .env

```env
BULL_BOARD_SECRET_KEY=your-secret-key-here
```

#### Cách 1: Query String (Dễ nhất cho browser)

```
http://localhost:3000/admin/queues?key=your-secret-key-here
```

#### Cách 2: Header (Curl/Postman)

```bash
curl "http://localhost:3000/admin/queues" \
  -H "X-Bull-Board-Key: your-secret-key-here"
```

## 🎨 Tính năng Bull Board

### Dashboard Overview

- **Xem tất cả queues**: default, email, notification
- **Real-time stats**: waiting, active, completed, failed, delayed jobs
- **Visual indicators**: màu sắc theo trạng thái

### Failed Jobs Management (Giống `failed_jobs` table)

#### Xem Failed Jobs

1. Truy cập Bull Board
2. Click vào queue (ví dụ: "email")
3. Click tab **"Failed"**

Thông tin hiển thị:
- Job ID
- Job name
- Failed reason / error message
- Stack trace
- Attempts made
- Timestamp
- Job data (payload)

#### Retry Failed Jobs

**Retry từng job:**
1. Click vào failed job
2. Click button **"Retry"**

**Retry tất cả failed jobs:**
1. Ở tab "Failed"
2. Click button **"Retry all"**

#### Remove Failed Jobs

1. Click vào failed job
2. Click button **"Remove"**

Hoặc dùng **"Clean"** để xóa hàng loạt.

### Job Details

Click vào bất kỳ job nào để xem:
- **Data**: Payload của job
- **Options**: attempts, delay, priority, backoff
- **Progress**: Tiến trình xử lý (nếu có)
- **Logs**: Error logs và stack trace
- **Timestamps**: Created, processed, completed/failed time
- **Attempts**: Số lần retry

### Queue Management

#### Pause Queue

Tạm dừng xử lý jobs:
1. Click vào queue
2. Click button **"Pause"**

Jobs mới vẫn được thêm vào nhưng không được xử lý cho đến khi resume.

#### Resume Queue

1. Click button **"Resume"**

#### Empty Queue

Xóa tất cả jobs (cẩn thận!):
1. Click button **"Empty"**

#### Clean Queue

Dọn dẹp completed hoặc failed jobs:
1. Click button **"Clean"**
2. Chọn loại: Completed, Failed, Delayed
3. Chọn grace period (jobs cũ hơn bao lâu)

## 🔧 Cấu hình

Cấu hình qua `configuration.ts` và env:

| Env | Mô tả | Default |
|-----|-------|---------|
| `BULL_BOARD_PATH` | URL path cho Bull Board UI | `/admin/queues` |
| `BULL_BOARD_ENABLED` | Bật/tắt (set `false` để tắt) | `true` |
| `BULL_BOARD_SECRET_KEY` | Key bảo vệ truy cập. Để trống = không bảo vệ | `` |

### Thay đổi Base Path

```env
# .env
BULL_BOARD_PATH=/admin/queues
```

### Tắt bảo vệ (Không dùng secret key)

Để trống `BULL_BOARD_SECRET_KEY` trong `.env` – Bull Board sẽ cho phép truy cập mà không cần key.

**⚠️ Chỉ dùng khi dev local, không khuyến nghị trên môi trường shared.**

### Thêm Queues mới vào Bull Board

1. Đăng ký queue trong `queue.module.ts`:
```typescript
BullModule.registerQueue({ name: 'your-new-queue' }),
```

2. Cập nhật `bull-board.service.ts`:
```typescript
constructor(
  @InjectQueue('default') private readonly defaultQueue: Queue,
  @InjectQueue('email') private readonly emailQueue: Queue,
  @InjectQueue('notification') private readonly notificationQueue: Queue,
  @InjectQueue('your-new-queue') private readonly yourNewQueue: Queue, // ← Thêm
  private readonly configService: ConfigService,
) {
  const basePath = this.configService.get('bullBoard.path') ?? BULL_BOARD_DEFAULT_PATH;
  this.serverAdapter = new ExpressAdapter();
  this.serverAdapter.setBasePath(basePath);

  createBullBoard({
    queues: [
      new BullAdapter(this.defaultQueue),
      new BullAdapter(this.emailQueue),
      new BullAdapter(this.notificationQueue),
      new BullAdapter(this.yourNewQueue), // ← Thêm
    ],
    serverAdapter: this.serverAdapter,
  });
}
```

## 📊 So sánh với Laravel

| Laravel Horizon | Bull Board |
|-----------------|------------|
| Dashboard với stats | ✅ Dashboard với real-time stats |
| Failed jobs table | ✅ Failed jobs tab với details |
| Retry failed jobs | ✅ Retry button cho từng job |
| Job details | ✅ Chi tiết job với data, logs, stack trace |
| Pause/continue | ✅ Pause/resume queues |
| Metrics & graphs | ⚠️ Chỉ có stats cơ bản (không có graphs) |
| Tags | ❌ Không có |
| Job batches | ❌ Không có (Bull không hỗ trợ) |

## 🔒 Security Notes

1. **Production**: Bull Board chỉ chạy trong development mode (kiểm tra `app.env`)
2. **Authentication**: Dùng `BULL_BOARD_SECRET_KEY` – key truyền qua `?key=XXX` hoặc header `X-Bull-Board-Key`. So sánh key dùng `crypto.timingSafeEqual` để tránh timing attack.
3. **Network**: Nếu deploy production, nên:
   - Dùng VPN hoặc IP whitelist
   - Hoặc tắt Bull Board hoàn toàn trong production

## 📝 Tips

### 1. Bookmark với key

Bookmark URL kèm key để truy cập nhanh:

```
http://localhost:3000/admin/queues?key=your-secret-key
```

### 2. Auto-refresh

Bull Board tự động refresh mỗi 5 giây. Để thay đổi:
- Click vào settings icon
- Chọn refresh interval

### 3. Filter Jobs

Dùng search box để filter jobs theo:
- Job ID
- Job name
- Status

### 4. Export Job Data

Click vào job → Copy job data để export JSON.

## 🆘 Troubleshooting

### Lỗi: "Unauthorized" / "Invalid or missing key"

**Nguyên nhân:** Key sai hoặc chưa truyền.

**Giải pháp:**
1. Kiểm tra `BULL_BOARD_SECRET_KEY` trong `.env` khớp với key dùng trong URL/header
2. Dùng `?key=YOUR_KEY` trong URL hoặc header `X-Bull-Board-Key: YOUR_KEY`

### Lỗi: "Cannot connect to Bull Board"

**Nguyên nhân:** App chưa chạy hoặc Bull Board chưa được mount.

**Giải pháp:**
1. Chạy `npm run start:dev`
2. Kiểm tra logs có dòng: `Bull Board (Queue Monitor): http://localhost:3000/admin/queues`

### Failed jobs không hiện trong UI

**Nguyên nhân:** Jobs đã bị clean hoặc `removeOnFail: true`.

**Giải pháp:**
- Đảm bảo `removeOnFail: false` trong queue config (đã set mặc định)
- Kiểm tra Redis: `docker compose exec redis redis-cli` → `LLEN bull:email:failed`
