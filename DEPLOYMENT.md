# راهنمای استقرار و پایپ‌لاین CI/CD صف‌شکن (SafShekan)

پروژه **صف‌شکن** مجهز به پایپ‌لاین CI/CD خودکار، پایگاه‌داده رابطه ای **PostgreSQL 17**، لایه صف و هماهنگی **Redis 7**، موتور **NestJS 12** و رابط کاربری **Next.js 16** در پشت **nginx gateway** است.

---

## معماری استقرار و کانتینرها

```mermaid
flowchart TD
  Browser["مرورگر کاربر (HTTPS)"] -->|":3000"| Nginx["Nginx Gateway (TLS)"]
  Nginx -->|"/"| Frontend["Next.js 16 (apps/frontend)"]
  Nginx -->|"/api /ws"| Backend["NestJS 12 (apps/backend)"]
  
  subgraph DockerNetwork ["شبکه ایزوله داخلی (safshekan-net)"]
    Frontend
    Backend
    Postgres[("PostgreSQL 17\n(ACID Persistence & Audits)")]
    Redis[("Redis 7\n(Locking, Queues, Cache)")]
    
    Backend -->|"Drizzle ORM (5432)"| Postgres
    Backend -->|"BullMQ & Locks (6379)"| Redis
  end
```

| سرویس | آدرس و دسترسی | نقش و توضیحات |
|---|---|---|
| **nginx** | تنها پورت عمومی `:3000` | Gateway عمومی با TLS، پروکسی `/api` و `/ws` به backend و `/` به frontend |
| **frontend** | داخلی `frontend:3000` | رابط کاربری Next.js 16 با توکن‌های شیشه‌ای و کامپوننت‌های رادیکس |
| **backend** | داخلی `backend:3000` | موتور سرخطی، احراز هویت بدون وضعیت، صف Undici و درگاه وب‌سوکت |
| **postgres** | داخلی `postgres:5432` | پایگاه‌داده رابطه ای PostgreSQL 17 با والیوم `safshekan_pgdata` |
| **redis** | داخلی `redis:6379` | ردیس ۷ برای قفل توزیع‌شده با توکن فنسینگ، صف BullMQ، ریت‌لیمیتینگ و کش |

---

## مشخصات سرور و پورت‌ها

- **آدرس سرور:** `5.159.49.36`
- **پورت عمومی:** `https://5.159.49.36:3000`
- **مستندات Swagger:** `https://5.159.49.36:3000/api/docs`
- **Health Check:** `https://5.159.49.36:3000/api/health`
- **Ready Check:** `https://5.159.49.36:3000/api/ready`
- **Restricted Metrics:** `https://5.159.49.36:3000/api/metrics` (محدود به آی‌پی‌های داخلی، توکن یا دسترسی ادمین)
- **مسیر پروژه در سرور:** `/opt/saf-shekan`

---

## تنظیم متغیرهای محیطی (`.env`)

فایل `.env` باید بر روی سرور در مسیر `/opt/saf-shekan/.env` ایجاد گردد (مطابق با `.env.example`):

```bash
# نمونه تنظیمات محیط تولید:
NODE_ENV=production
PORT=3000

# پایگاه‌داده PostgreSQL 17
POSTGRES_DB=safshekan_db
POSTGRES_USER=safshekan
POSTGRES_PASSWORD=your_strong_postgres_password_32_chars
DATABASE_URL=postgres://safshekan:your_strong_postgres_password_32_chars@postgres:5432/safshekan_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# ردیس 7
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_strong_redis_password_32_chars
REDIS_MAXMEMORY=128mb

# کلید رمزنگاری محرمانه کارگزاری‌ها (AES-256-GCM Envelope Encryption)
# تولید با: openssl rand -hex 32
ENCRYPTION_MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
ENCRYPTION_KEY_VERSION=1

# کلیدهای نامتقارن Ed25519 برای JWT (Access Token)
JWT_KEY_ID=safshekan-ed25519-v1
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# محافظت CSRF
CSRF_ALLOWED_ORIGINS=https://5.159.49.36:3000

# پایش و متریک‌ها
METRICS_AUTH_TOKEN=your_secure_internal_metrics_bearer_token
```

---

## تنظیم Secretهای گیت‌هاب (CI/CD)

مسیر: **Settings → Secrets and variables → Actions**

| نام Secret | مقدار | الزامی |
|---|---|---|
| `SSH_HOST` | `5.159.49.36` | اگر خالی باشد همین آدرس استفاده می‌شود |
| `SSH_USER` | `root` | اگر خالی باشد `root` استفاده می‌شود |
| `SSH_PRIVATE_KEY` | محتوای کلید خصوصی Ed25519 | بله |
| `GHCR_PULL_TOKEN` | PAT با scope `read:packages` | اختیاری |

---

## مایگریشن پایگاه‌داده و مقداردهی اولیه

### ۱. اجرای خودکار مایگریشن‌های ساختار دیتابیس (Drizzle Migrations)
مایگریشن‌ها با استفاده از قفل مشاوره‌ای PostgreSQL (`pg_advisory_lock(987654321)`) اجرا می‌شوند تا در صورت اجرای هم‌زمان چندین رانر، هیچ تداخلی رخ ندهد:

```bash
# اجرای مایگریشن‌ها در کانتینر یا هاست:
pnpm --filter @saf-shekan/backend db:migrate
```

### ۲. مهاجرت داده‌های قدیمی `config.json` به دیتابیس (یک‌بار مصرف و امن)
کانفیگ‌های قبلی فایل `config.json` هرگز در بوت برنامه بارگذاری خودکار نمی‌شوند. انتقال آن‌ها از طریق CLI اختصاصی و درون یک تراکنش اتمیک انجام می‌شود:

```bash
# از روی هاست در مسیر پروژه:
pnpm cli migrate-config

# یا داخل کانتینر بک‌اند:
docker compose exec backend node dist/apps/backend/src/cli.js migrate-config
```
- تمام اطلاعات محرمانه کارگزاری‌ها با الگوریتم **AES-256-GCM Envelope Encryption** رمزنگاری شده و نسخه کلید ذخیره می‌شود.
- یک فایل پشتیبان با نام `config.json.migrated.<timestamp>.bak` ایجاد می‌گردد.
- دستور کاملاً Idempotent است و اجرای مجدد آن داده تکراری ایجاد نمی‌کند.

### ۳. ایجاد کاربر مدیر اولیه (Initial Administrator Bootstrap)
سیستم از مدل RBAC تک‌مستأجره پشتیبانی می‌کند و ثبت‌نام عمومی ندارد:

```bash
# ایجاد ادمین اولیه:
pnpm cli create-admin admin "YourStrongPassword123!" "مدیر ارشد سامانه"

# یا داخل کانتینر بک‌اند:
docker compose exec backend node dist/apps/backend/src/cli.js create-admin admin "YourStrongPassword123!" "مدیر ارشد سامانه"
```

---

## رویه‌های چرخش کلیدها (Key Rotation Procedures)

### ۱. چرخش کلید نامتقارن Ed25519 (توکن‌های دسترسی JWT)
1. جفت کلید جدید Ed25519 تولید کنید:
   ```bash
   openssl genpkey -algorithm Ed25519 -out ed25519_v2_private.pem
   openssl pkey -in ed25519_v2_private.pem -pubout -out ed25519_v2_public.pem
   ```
2. شناسه کلید جدید (`JWT_KEY_ID=safshekan-ed25519-v2`) و محتوای کلید خصوصی را در `.env` قرار دهید.
3. کلید عمومی قبلی را در لیست کلیدهای معتبر سرویس نگه دارید تا توکن‌های صادر شده با نسخه قبل تا زمان انقضا (حداکثر ۱۵ دقیقه) به صورت معتبر اعتبارسنجی شوند.
4. کانتینر backend را reload کنید:
   ```bash
   docker compose restart backend
   ```

### ۲. چرخش کلید مستر رمزنگاری (Envelope Encryption Master Key)
1. کلید مستر جدید ۲۵۶ بیتی هگز تولید کنید:
   ```bash
   openssl rand -hex 32
   ```
2. مقدار `ENCRYPTION_MASTER_KEY` را در `.env` با مقدار جدید بروز کرده و `ENCRYPTION_KEY_VERSION` را افزایش دهید (مثلاً از `1` به `2`).
3. اکانت‌های کارگزاری با نسخه کلید قدیمی با کلید قبلی خوانده شده و در اولین ویرایش با کلید جدید بازنویسی می‌شوند.

---

## پشتیبان‌گیری و بازیابی پایگاه‌داده (Backup & Disaster Recovery)

اسکریپت‌های کاملاً تست‌شده در پوشه `scripts/` قرار دارند:

### ۱. پشتیبان‌گیری دستی و دوره‌ای
```bash
# پشتیبان‌گیری روزانه (نگهداری ۷ نسخه آخر):
./scripts/backup-db.sh daily

# پشتیبان‌گیری هفتگی (نگهداری ۴ نسخه آخر):
./scripts/backup-db.sh weekly
```
- فایل‌های فشرده `safshekan_db_*.sql.gz` همراه با هش یکپارچگی `.sha256` در `/opt/saf-shekan/backups/` ذخیره می‌شوند.

### ۲. تنظیم زمان‌بندی خودکار در Crontab سرور
```bash
crontab -e
```
اضافه کردن خطوط زیر:
```cron
# پشتیبان‌گیری روزانه در ساعت ۳ بامداد
0 3 * * * /opt/saf-shekan/scripts/backup-db.sh daily >> /var/log/safshekan-backup.log 2>&1

# پشتیبان‌گیری هفتگی در ساعت ۴ بامداد جمعه‌ها
0 4 * * 5 /opt/saf-shekan/scripts/backup-db.sh weekly >> /var/log/safshekan-backup.log 2>&1
```

### ۳. ارسال نسخه پشتیبان به سرور بیرونی (Off-Site Backup)
با استفاده از `rclone` یا `rsync`:
```bash
# نمونه ارسال با rsync به سرور پشتیبان مجزا:
rsync -avz --delete /opt/saf-shekan/backups/ backup-server:/storage/safshekan-backups/
```

### ۴. بازیابی دیتابیس (Disaster Recovery Restore)
```bash
# بازیابی اتمیک با اعتبارسنجی هش sha256 و قطع اتصالات فعال قبلی:
./scripts/restore-db.sh /opt/saf-shekan/backups/daily/safshekan_db_daily_20261012_030000.sql.gz
```

---

## امنیت انتقال و نشست‌ها (Security & Transport)

1. **انتقال امن توکن‌ها در کوکی:**
   - هر دو توکن `access_token` و `refresh_token` فقط در کوکی‌های `httpOnly`، `Secure` و `SameSite=Strict` ذخیره می‌شوند.
   - جاوااسکریپت مرورگر هیچ دسترسی به توکن‌ها ندارد (حفاظت ۱۰۰٪ در برابر XSS).
   - توکن‌های بازنشانی (Refresh Token) تصادفی ۲۵۶ بیتی مات بوده و فقط هش SHA-256 آن‌ها در جدول `sessions` ذخیره می‌شود. در صورت استفاده مجدد، کل خانواده نشست کاربر باطل می‌شود.
2. **محافظت CSRF:**
   - اعتبارسنجی خودکار هدرهای `Origin` و `Sec-Fetch-Site` روی تمام درخواست‌های تغییر وضعیت داده (`POST`, `PUT`, `PATCH`, `DELETE`).
3. **احراز هویت دو مرحله‌ای (TOTP 2FA):**
   - پشتیبانی از استانداردهای RFC 6238 با نرم‌افزارهای Google Authenticator و ۱۰ کد بازیابی یک‌بار مصرف هش‌شده با SHA-256.
   - قفل موقت حساب کاربری (۱۵ دقیقه) پس از ۵ بار تلاش ناموفق پیاپی با پیام خطای جنریک جهت جلوگیری از حملات Brute-Force و Enumeration.
4. **موتور سرخطی در مسیر داغ (Hot-Path Zero-Network Guarantee):**
   - در حلقه شلیک ۳.۵ میلی‌ثانیه‌ای، **هیچ درخواست شبکه‌ای به دیتابیس یا ردیس ارسال نمی‌شود**. داده‌ها در حافظه کش شده و نتایج پس از شلیک از طریق رینگ‌بافر، صف BullMQ یا فایل دیسک اضطراری (`order-attempts.fallback.jsonl`) ذخیره می‌شوند.
5. **متریک‌های سیستم:**
   - اندپوینت `/api/metrics` برای عموم بسته بوده و فقط با رنج‌های آی‌پی خصوصی، توکن `METRICS_AUTH_TOKEN` یا دسترسی نقش ادمین قابل دسترسی است.

---

## روش‌های استقرار

### ۱. پایپ‌لاین CI/CD در GitHub Actions
فایل: `.github/workflows/ci-cd.yml`
با push به `main`:
1. مرحله تست و اعتبارسنجی مونوریپو (`pnpm test`).
2. ساخت ایمیج‌ها و انتشار در GHCR.
3. استقرار با SSH و بروزرسانی کانتینرها در سرور VPS.

### ۲. استقرار مستقیم از لوکال
```bash
pnpm run deploy:remote
```

### ۳. بررسی سلامت بعد از دیپلوی (Smoke Test)
```bash
curl -kf https://5.159.49.36:3000/api/health
curl -kf https://5.159.49.36:3000/api/ready
curl -kf https://5.159.49.36:3000/
```
