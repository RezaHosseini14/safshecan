# ⚡ صف‌شکن (SafShekan) | سامانه جامع مونوریپو سرخطی بورس تهران

[![Turborepo](https://img.shields.io/badge/Turborepo-v2.11-000000?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-Workspaces_9.15-orange?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16_AppRouter-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-12_Enterprise-e0234e?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9_Strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

**صف‌شکن (SafShekan Monorepo)** یک اکوسیستم سازمانی، فوق‌سریع و مبتنی بر معماری نوین **Monorepo (Turborepo + pnpm Workspaces)** برای استقرار الگوریتم‌های سرخطی (IPO Sniping) و معاملات با فرکانس بالا (HFT) در بازار بورس اوراق بهادار تهران (TSE) و فرابورس ایران است.

---

## 🏛️ معماری مونوریپو (Monorepo Architecture)

پروژه به صورت کاملاً ماژولار و تفکیک‌شده به دو بخش **اپلیکیشن‌ها (`apps`)** و **پکیج‌های اشتراکی (`packages`)** سازمان‌دهی شده است:

```text
saf-shekan/
├── .github/
│   └── workflows/
│       └── ci.yml                 # پایپ‌لاین CI در گیت‌هاب با کش هوشمند توربو
├── apps/
│   ├── api/                       # سرویس بک‌اند سازمانی بر پایه NestJS 12
│   │   ├── src/                   # موتور معاملاتی، اتصال وب‌سوکت، سرور REST، درگاه کارگزاری‌ها
│   │   ├── test/                  # مجموعه تست‌های یکپارچه E2E
│   │   └── package.json           # @saf-shekan/api
│   ├── web/                       # رابط کاربری نسل نوین با Next.js 16 و Tailwind CSS v4
│   │   ├── src/                   # کامپوننت‌های رادیکس، داشبورد شیشه‌ای، مانیتور صف، نمودارها
│   │   ├── test/                  # تست‌های رابط کاربری با Vitest
│   │   └── package.json           # @saf-shekan/web
│   └── cli/                       # ابزار تعاملی و پرسرعت خط فرمان ترمینال (Terminal CLI)
│       ├── src/                   # شبیه‌ساز سفارش، تست پینگ، برآورد صف، محاسبه کارمزد
│       └── package.json           # @saf-shekan/cli
├── packages/
│   ├── core/                      # هسته محاسباتی مشترک بورس و مدل‌های دامنه
│   │   ├── src/
│   │   │   ├── types.ts           # تایپ‌های یکپارچه سفارش، پکت و پیکربندی
│   │   │   ├── constants.ts       # ساعات معاملاتی، سرورهای NTP، قالب کارگزاری‌ها
│   │   │   ├── fee-calculator.ts  # محاسبه‌گر دقیق کارمزد و مالیات بورس و نقطه سربه‌سر
│   │   │   ├── queue-estimator.ts # الگوریتم تخمین جایگاه در صف بر اساس میلی‌ثانیه
│   │   │   └── index.ts           # خروجی استاندارد ماژول
│   │   └── package.json           # @saf-shekan/core
│   ├── tsconfig/                  # تنظیمات اشتراکی و بهینه کامپایلر تایپ‌اسکریپت
│   │   ├── base.json
│   │   ├── nestjs.json
│   │   ├── nextjs.json
│   │   └── package.json           # @saf-shekan/tsconfig
│   └── eslint-config/             # استاندارد کدنویسی و قوانین Linter
│       ├── index.js
│       └── package.json           # @saf-shekan/eslint-config
├── docker/
│   ├── Dockerfile.api             # داکر ایمیج سبک و چندمرحله‌ای برای سرور بک‌اند
│   └── Dockerfile.web             # داکر ایمیج بهینه‌شده برای داشبورد وب
├── docker-compose.yml             # ترکیب و راه‌اندازی هم‌زمان سرویس‌ها با داکر کامپوز
├── pnpm-workspace.yaml            # تعریف ورک‌اسپیس‌های pnpm
├── turbo.json                     # پایپ‌لاین وظایف توربورپو با کش فوق‌سریع
└── package.json                   # هماهنگ‌کننده روت مونوریپو
```

---

## ⚡ مزایای معماری Turborepo در صف‌شکن

1. **کش ابری و محلی فوق‌سریع (Incremental Computation):** وظایف بدون تغییر در کسری از میلی‌ثانیه مستقیماً از کش بازخوانی می‌شوند (`FULL TURBO`).
2. **اجرای موازی پایپ‌لاین‌ها (Parallel Task Pipeline):** کامپایل فرانت‌اند و بک‌اند و تست‌ها به صورت هم‌زمان و وابسته به گراف وابستگی انجام می‌پذیرد.
3. **اشتراک امن نوع‌داده‌ها (End-to-End Type Safety):** هر تغییری در اینترفیس‌ها بلافاصله در فرانت‌اند، بک‌اند و CLI منعکس و اعتبارسنجی می‌شود.
4. **داکرایز هوشمند با `turbo prune`:** ساخت ایمیج‌های سبک بدون نیاز به ارسال کل کدبیس به داخل کانتینر.

---

## 🛠️ دستورات خط فرمان ریشه (Root Scripts)

تمامی دستورات از ریشه پروژه با استفاده از `pnpm` قابل اجرا هستند:

| دستور | توضیحات |
| :--- | :--- |
| `pnpm dev` | اجرای هم‌زمان محیط توسعه برای API و Web با توربورپو |
| `pnpm dev:api` | اجرای محیط توسعه فقط برای سرور بک‌اند NestJS |
| `pnpm dev:web` | اجرای محیط توسعه فقط برای داشبورد فرانت‌اند Next.js |
| `pnpm build` | کامپایل کامل پکیج‌ها با خط لوله Turborepo و کش هوشمند |
| `pnpm build:full` | ساخت پکیج نهایی و خروجی استاتیک وب و پیوند با توزیع سرور |
| `pnpm test` | اجرای تمامی تست‌های واحد و E2E در سراسر ورک‌اسپیس‌ها |
| `pnpm test:api` | اجرای تست‌های E2E مربوط به سرور بک‌اند و انجین سرخطی |
| `pnpm test:web` | اجرای تست‌های کامپوننت‌های فرانت‌اند |
| `pnpm cli` | اجرای ابزار تعاملی خط فرمان در ترمینال |
| `pnpm start` | اجرای نسخه نهایی سرور سرخطی بر روی پورت `3880` |
| `pnpm clean` | پاکسازی بیلدها و کش پروژه‌ها |

---

## 💻 ابزار ترمینال (`@saf-shekan/cli`)

صف‌شکن مجهز به یک رابط ترمینالی سریع جهت بررسی وضعیت و شبیه‌سازی در سرورهای مجازی (VPS) است:

```bash
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

برای اجرای کامل پشته معاملاتی (NestJS API + Next.js Web) در محیط‌های کانتینری و VPS:

```bash
# راه‌اندازی کانتینرهای سرویس‌ها در پس‌زمینه
docker compose up -d --build

# بررسی لاگ‌های زنده سرور
docker compose logs -f api

# متوقف کردن کانتینرها
docker compose down
```

- سرویس API: `http://localhost:3880`
- داشبورد Web: `http://localhost:3000`

---

## 🧪 استانداردهای تست و پایداری (Testing Suite)

- **Backend (NestJS):** تست‌های E2E پوشش‌دهنده ریت‌لیمیتینگ، احراز هویت، وب‌سوکت، موتور سرخطی و شبیه‌سازی بک‌تست.
- **Frontend (Next.js):** تست‌های رندرینگ ساعت اتمی، تغییر قالب تاریک/روشن، فرم ثبت سفارش، و گزارشات.
- **یکپارچگی پایپ‌لاین CI/CD:** خط لوله خودکار در `.github/workflows/ci-cd.yml` تمامی مراحل اعتبارسنجی، بیلد داکر، انتشار در GHCR و دیپلوی خودکار به سرور پروداکشن VPS را بدون قطعی انجام می‌دهد.

---

## 🚀 استقرار و استقرار در پروداکشن (CI/CD Deployment)

برای مشاهده جزئیات کامل و کلیدهای استقرار، فایل [DEPLOYMENT.md](file:///e:/main-projects/saf-shekan/DEPLOYMENT.md) را مطالعه نمایید.

```bash
# استقرار مستقیم و با یک دستور از ترمینال لوکال به سرور (5.159.49.36)
pnpm run deploy:remote
```

---

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است.
