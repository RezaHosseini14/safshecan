# ⚡ صف‌شکن (SafShekan) | سامانه جامع مونوریپو سرخطی بورس تهران

[![Turborepo](https://img.shields.io/badge/Turborepo-v2.11-000000?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-Workspaces_9.15-orange?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16_AppRouter-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-12_Enterprise-e0234e?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17_ACID-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7_HA-dc382d?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9_Strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

**صف‌شکن (SafShekan Monorepo)** یک اکوسیستم سازمانی، فوق‌سریع و مبتنی بر معماری نوین **Monorepo (Turborepo + pnpm Workspaces)** برای استقرار الگوریتم‌های سرخطی (IPO Sniping) و معاملات با فرکانس بالا (HFT) در بازار بورس اوراق بهادار تهران (TSE) و فرابورس ایران است.

---

## 🏛️ معماری مونوریپو و پشته داده (Data & Infrastructure Stack)

پروژه به صورت کاملاً ماژولار و تفکیک‌شده به دو بخش **اپلیکیشن‌ها (`apps`)** و **پکیج‌های اشتراکی (`packages`)** سازمان‌دهی شده است:

```text
saf-shekan/
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # پایپ‌لاین CI/CD در گیت‌هاب با کش هوشمند و استقرار خودکار
├── apps/
│   ├── backend/                   # سرویس بک‌اند سازمانی بر پایه NestJS 12
│   │   ├── src/                   # موتور معاملاتی، اتصال وب‌سوکت، سرور REST، درگاه کارگزاری‌ها
│   │   │   ├── auth/              # احراز هویت Ed25519، نشست‌های کوکی، TOTP 2FA، CSRF و لاگ‌اوت
│   │   │   ├── infrastructure/    # لایه Drizzle ORM، کلاینت Redis، قفل توزیع‌شده و صف BullMQ
│   │   │   └── engine/            # موتور سرخطی ایزوله با تضمین Zero-Network در مسیر شلیک
│   │   ├── test/                  # مجموعه تست‌های یکپارچه E2E و مسیر داغ
│   │   └── package.json           # @saf-shekan/backend
│   ├── frontend/                  # رابط کاربری نسل نوین با Next.js 16 و Tailwind CSS v4
│   │   ├── src/                   # کامپوننت‌های رادیکس/shadcn، ورود، ۲FA، پروفایل، مدیریت کاربران
│   │   ├── test/                  # تست‌های رابط کاربری با Vitest
│   │   └── package.json           # @saf-shekan/frontend
│   └── cli/                       # ابزار تعاملی و پرسرعت خط فرمان ترمینال (Terminal CLI)
│       ├── src/                   # شبیه‌ساز سفارش، تست پینگ، برآورد صف، مایگریشن و ایجاد ادمین
│       └── package.json           # @saf-shekan/cli
├── packages/
│   ├── core/                      # هسته محاسباتی مشترک بورس و مدل‌های دامنه
│   ├── i18n/                      # کاتالوگ بین‌المللی‌سازی و متون فارسی (بدون کاراکتر هاردکد در کدها)
│   ├── tsconfig/                  # تنظیمات اشتراکی و بهینه کامپایلر تایپ‌اسکریپت
│   └── eslint-config/             # استاندارد کدنویسی و قوانین Linter
├── scripts/
│   ├── backup-db.sh               # اسکریپت بکاپ‌گیری دوره‌ای روزانه/هفتگی دیتابیس با هش SHA-256
│   └── restore-db.sh              # اسکریپت بازیابی خودکار و اتمیک پایگاه داده
├── docker-compose.yml             # راه‌اندازی Postgres 17، Redis 7، Backend، Frontend و Nginx
└── package.json                   # هماهنگ‌کننده روت مونوریپو
```

---

## 🔒 ویژگی‌های کلیدی امنیت و زیرساخت (Enterprise Grade)

1. **جداسازی مسیر بحرانی (Hot-Path Zero-Network Guarantee):**
   در حین حلقه شلیک سرخطی (بازه ۳.۵ میلی‌ثانیه)، موتور شلیک از حافظه گرم (Pre-warmed Memory) و استخر سوکت‌های از پیش باز شده Undici استفاده کرده و **هیچ کوئری به دیتابیس یا ردیس نمی‌زند**.
2. **پایداری سفارشات (Durability Ring Buffer & Disk Fallback):**
   شلیک‌ها در رینگ‌بافر ۵۰۰۰تایی نگهداری و پس از شلیک به صف BullMQ ارسال می‌شوند. در صورت بروز اختلال در ردیس، نتایج بدون افت پرفورمنس بلافاصله در فایل دیسک اضطراری `order-attempts.fallback.jsonl` نوشته شده و در استارت‌آپ بعدی به‌صورت تراکنشی ری‌پلی می‌شوند.
3. **رمزنگاری سازمانی اطلاعات کارگزاری (AES-256-GCM Envelope Encryption):**
   کلیه اطلاعات محرمانه و توکن‌های ورود کارگزاری‌ها با رمزنگاری پاکتی و ثبت نسخه کلید (`key_version`) ذخیره می‌شوند.
4. **توکن‌های امن نامتقارن (Ed25519 & Opaque Refresh Tokens):**
   - توکن‌های دسترسی با الگوریتم نامتقارن Ed25519 امضا شده و از چرخش کلید با هدر `kid` پشتیبانی می‌کنند.
   - رفرش‌توکن‌ها رشته‌های مات تصادفی ۲۵۶ بیتی هستند که فقط هش SHA-256 آن‌ها در جدول نشست‌ها ذخیره می‌شود.
   - تشخیص استفاده مجدد (Reuse Detection) و ابطال کل خانواده نشست‌ها در صورت مشاهده رفتار مشکوک.
5. **انتقال ۱۰۰٪ امن فقط با کوکی (Strict Cookie Transport):**
   توکن‌ها فقط در کوکی‌های `httpOnly`، `Secure` و `SameSite=Strict` قرار دارند و جاوااسکریپت فرانت‌اند هرگز به آن‌ها دسترسی ندارد (حفاظت کامل در برابر سرقت از طریق XSS).
6. **محافظت CSRF و احراز هویت دومرحله‌ای (TOTP 2FA):**
   - اعتبارسنجی هدرهای `Origin` و `Sec-Fetch-Site` روی کلیه درخواست‌های تغییر وضعیت داده.
   - ورود دو مرحله‌ای RFC 6238 با نرم‌افزارهای استاندارد و ۱۰ کد بازیابی یک‌بار مصرف هش‌شده با SHA-256.
   - قفل موقت حساب کاربری (۱۵ دقیقه) پس از ۵ بار تلاش ناموفق پیاپی جهت جلوگیری از بروت‌فورس.

---

## 🛠️ دستورات خط فرمان ریشه (Root Scripts)

تمامی دستورات از ریشه پروژه با استفاده از `pnpm` قابل اجرا هستند:

| دستور | توضیحات |
| :--- | :--- |
| `pnpm dev` | اجرای فقط API بک‌اند NestJS روی پورت `3000` |
| `pnpm dev:backend` | اجرای محیط توسعه فقط برای سرور بک‌اند NestJS |
| `pnpm dev:frontend` | اجرای Next.js به‌تنهایی (HMR) |
| `pnpm dev:ui` | توسعه با HMR فرانت روی `:3000` و backend داخلی روی `:3001` (پیشنهادی برای UI) |
| `pnpm build` | کامپایل کامل تمام پکیج‌ها با خط لوله Turborepo و کش هوشمند |
| `pnpm test` | اجرای تمامی تست‌های واحد، E2E و تست‌های i18n در سراسر ورک‌اسپیس‌ها |
| `pnpm test:backend` | اجرای تست‌های E2E سرور بک‌اند و انجین سرخطی |
| `pnpm test:frontend` | اجرای تست‌های کامپوننت‌های فرانت‌اند |
| `pnpm cli` | اجرای ابزار تعاملی خط فرمان در ترمینال |
| `pnpm start` | اجرای نسخه نهایی API بک‌اند روی پورت `3000` |
| `pnpm clean` | پاکسازی بیلدها و کش پروژه‌ها |

---

## 💻 ابزار ترمینال (`@saf-shekan/cli`)

صف‌شکن مجهز به یک رابط ترمینالی سریع جهت مدیریت، مهاجرت داده‌ها و شبیه‌سازی است:

```bash
# ایجاد مدیر اولیه سامانه (Initial Admin Bootstrap)
pnpm cli create-admin admin "YourPassword123!" "مدیر ارشد سامانه"

# مهاجرت امن و یک‌بار مصرف داده‌های config.json به دیتابیس PostgreSQL
pnpm cli migrate-config

# مشاهده وضعیت سرور و موتور سرخطی
pnpm cli status

# محاسبه کارمزد، مالیات و قیمت سر به سر بورس تهران
pnpm cli fee -p 25000 -q 500

# محاسبه رتبه تخمینی در صف سفارشات بر اساس میلی‌ثانیه رسیدن پکت
pnpm cli queue -d 4 -l 20

# مشاهده لیست کارگزاری‌های پیش‌فرض
pnpm cli presets
```

---

## 🐳 استقرار با Docker و Docker Compose

برای اجرای کامل پشته (PostgreSQL 17 + Redis 7 + NestJS + Next.js + Nginx):

```bash
# راه‌اندازی کانتینرهای سرویس‌ها در پس‌زمینه
docker compose up -d --build

# اجرای مایگریشن‌های اولیه دیتابیس
pnpm --filter @saf-shekan/backend db:migrate

# بررسی لاگ‌های زنده سرور
docker compose logs -f

# متوقف کردن کانتینرها
docker compose down
```

- **داشبورد کاربری:** `https://localhost:3000/`
- **ورود به سامانه:** `https://localhost:3000/login`
- **مستندات Swagger:** `https://localhost:3000/api/docs`
- **سلامت سیستم:** `https://localhost:3000/api/health` و `https://localhost:3000/api/ready`

---

## 🚀 استقرار و عملیات پروداکشن (CI/CD Deployment)

برای مشاهده جزئیات کامل متغیرهای محیطی، رویه چرخش کلیدها و اسکریپت‌های پشتیبان‌گیری، فایل [DEPLOYMENT.md](file:///e:/main-projects/saf-shekan/DEPLOYMENT.md) را مطالعه نمایید.

```bash
# استقرار مستقیم و با یک دستور از ترمینال لوکال به سرور (5.159.49.36)
pnpm run deploy:remote
```

---

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است.
