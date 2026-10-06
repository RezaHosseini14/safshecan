import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export const tourSteps: DriveStep[] = [
  {
    element: '#tour-logo',
    popover: {
      title: '🚀 خوش‌آمدید به سامانه هوشمند صف‌شکن',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-sm font-medium leading-relaxed">
            به پیشرفته‌ترین موتور سرخطی‌زن فرکانس بالای بورس تهران (TSE HFT) خوش آمدید.
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            این سامانه برای کسب رتبه نخست در روزهای پس از عرضه اولیه با دقت زیر میلی‌ثانیه‌ای (<span class="font-mono text-emerald-400">Microsecond-Precision</span>) طراحی شده است.
          </p>
          <div class="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
            💡 در این تور جامع، تمام بخش‌های سامانه و راهکارهای رسیدن به رتبه ۱ صف را گام‌به‌گام مرور می‌کنیم.
          </div>
        </div>
      `,
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-telemetry',
    popover: {
      title: '📡 نوار وضعیت و تله‌متری زنده',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            در این بخش وضعیت لحظه‌ای موتور سرخطی را مشاهده می‌کنید:
          </p>
          <ul class="text-xs space-y-1 text-muted-foreground list-disc list-inside">
            <li><strong class="text-foreground">وضعیت موتور:</strong> حالت‌های آماده، مسلح (ARMED)، پیش‌گرمایش و شلیک.</li>
            <li><strong class="text-sky-400 font-mono">Δ NTP:</strong> اختلاف میلی‌ثانیه‌ای ساعت سیستم شما با ساعت رسمی بورس ایران.</li>
            <li><strong class="text-emerald-400 font-mono">PING:</strong> زمان رفت و برگشت پکت‌ها تا سرورهای معاملات.</li>
          </ul>
        </div>
      `,
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-atomic-clock',
    popover: {
      title: '⏱️ ساعت اتمی مرجع بورس تهران',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            هسته معاملات بورس بر اساس اولویت زمانی (<span class="font-mono text-amber-400">Time-Priority</span>) کار می‌کند. حتی ۱ میلی‌ثانیه قبل از ساعت هدف خطا دریافت می‌کند و چند میلی‌ثانیه بعد، صف میلیونی تشکیل می‌شود!
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            ساعت اتمی صف‌شکن با دقت میکروثانیه از طریق پروتکل رسمی NTP و هدرهای سرورهای تهران همگام‌سازی می‌شود و ثانیه‌شمار زنده تا راس ۰۸:۴۵:۰۰.۰۰۰ را نمایش می‌دهد.
          </p>
        </div>
      `,
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-ntp-tuning',
    popover: {
      title: '🎯 کالیبراسیون و انحراف دستی زمان (NTP Tuning)',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            با کلیک روی دکمه <strong class="text-emerald-400">همگام‌سازی زمان</strong>، انحراف ساعت با چندین سرور مرجع سنجیده و جبران می‌شود.
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            همچنین با دکمه‌های انحراف دستی می‌توانید برای پیش‌دستی هوشمند، زمان شلیک را با کسری از میلی‌ثانیه جابه‌جا کنید.
          </p>
        </div>
      `,
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-master-control',
    popover: {
      title: '🎛️ مرکز کنترل و مسلح‌سازی شلیک (ARM)',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            کلیدهای اصلی هدایت ربات در اینجا قرار دارند:
          </p>
          <ul class="text-xs space-y-1.5 text-muted-foreground">
            <li><span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span><strong class="text-foreground">مسلح‌سازی سرخطی (ARM):</strong> موتور را برای پرواز در ساعت هدف آماده می‌کند.</li>
            <li><span class="inline-block w-2 h-2 rounded-full bg-sky-500 mr-1.5"></span><strong class="text-foreground">تست شلیک فوری:</strong> یک شلیک تک‌سهم تستی برای راستی‌آزمایی نشست و اتصال کارگزاری.</li>
            <li><span class="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span><strong class="text-foreground">محافظت توقف هوشمند (Anti-Double-Spend):</strong> با اولین ثبت موفق سفارش، شلیک‌های بعدی فوراً لغو می‌شوند تا پول شما دوبار مصرف نشود.</li>
          </ul>
        </div>
      `,
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-curl-parser',
    popover: {
      title: '🪄 جادوگر ایمپورت فوق‌سریع نشست کارگزاری (cURL Magic)',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            نیازی به وارد کردن دستی توکن‌ها و کوکی‌های پیچیده ندارید!
          </p>
          <ol class="text-xs space-y-1 text-muted-foreground list-decimal list-inside">
            <li>در مرورگر وارد سامانه معاملاتی شوید و <span class="font-mono text-emerald-400">F12</span> بزنید.</li>
            <li>یک درخواست خرید تستی ثبت نمایید.</li>
            <li>در تب Network روی درخواست کلیک‌راست کرده و <span class="font-mono text-emerald-400">Copy as cURL</span> را انتخاب کنید.</li>
            <li>متن را اینجا پیست کنید تا تمام هدرها و توکن‌ها خودکار شناسایی و ذخیره شوند.</li>
          </ol>
        </div>
      `,
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-order-form',
    popover: {
      title: '📝 مشخصات سفارش و قالب‌های پیش‌ساخته کارگزاری',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            نماد عرضه اولیه، قیمت سقف مجاز (مثلاً حداکثر آستانه روزانه) و حجم سفارش را مشخص کنید.
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            همچنین قالب‌های پیش‌ساخته برای سامانه‌های <strong class="text-foreground">تدبیرپرداز</strong>، <strong class="text-foreground">رایان‌بورس</strong>، <strong class="text-foreground">ایزی‌تریدر مفید</strong> و <strong class="text-foreground">فارابیکسو</strong> تنها با یک کلیک فعال می‌شوند.
          </p>
        </div>
      `,
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-engine-settings',
    popover: {
      title: '⚡ تنظیمات موتور HFT و شلیک رگباری (Burst Mode)',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            قلب تپنده پیروزی در صف‌های میلیونی:
          </p>
          <ul class="text-xs space-y-1.5 text-muted-foreground">
            <li><strong class="text-foreground">زمان پیش‌گرمایش (Pre-Warm):</strong> باز کردن و گرم نگه داشتن سوکت‌های SSL/TCP ثانیه‌ها قبل از شلیک جهت حذف کامل تاخیر Handshake.</li>
            <li><strong class="text-foreground">زمان جبران پینگ (Lead Time):</strong> ارسال پکت چند میلی‌ثانیه قبل از ۰۸:۴۵ تا با احتساب زمان سفر پکت، دقیقاً در راس ثانیه به هسته برسد.</li>
            <li><strong class="text-foreground">شلیک رگباری (Burst Count & Interval):</strong> ارسال متوالی چندین پکت با فواصل فوق‌العاده کوتاه (مثلاً ۵ پکت با فاصله ۳ میلی‌ثانیه).</li>
          </ul>
        </div>
      `,
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-network-diagnostics',
    popover: {
      title: '🔍 عیب‌یابی شبکه، پینگ و اتصال مستقیم',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            بررسی زنده تاخیر ارتباطی (RTT) با درگاه کارگزاری انتخابی.
          </p>
          <div class="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-300">
            💡 برای تضمین بالاترین احتمال نفر اول شدن، اجرای ربات بر روی سرور مجازی (VPS) داخل دیتاسنترهای تهران (آسیاتک برج میلاد، تبیان یا افرانت) پینگ شما را به ۱ الی ۳ میلی‌ثانیه کاهش می‌دهد.
          </div>
        </div>
      `,
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-live-terminal',
    popover: {
      title: '💻 ترمینال پخش زنده لاگ و فیزیک شلیک',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            تمامی رویدادها، ریز-ثانیه‌های ارسال پکت، کدهای پاسخ وب‌سرویس کارگزاری، خطاهای احتمالی و تاییدیه ثبت سفارش به صورت زنده و جریانی در این ترمینال ثبت می‌شوند.
          </p>
        </div>
      `,
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-backtest-btn',
    popover: {
      title: '🎲 شبیه‌ساز مونت‌کارلو و بک‌تست هوشمند',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            می‌توانید سناریوهای مختلف بازگشایی بازار را قبل از ساعت معامله واقعی شبیه‌سازی کنید!
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            موتور شبیه‌ساز با تحلیل نوسانات پینگ و رقابت معامله‌گران دیگر، درصد احتمال قرار گرفتن در جایگاه‌های ۱ تا ۱۰ صف خرید را به شما نمایش می‌دهد.
          </p>
        </div>
      `,
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-reports-nav',
    popover: {
      title: '📊 گزارش‌ها و آرشیو شلیک‌های پیشین',
      description: `
        <div class="space-y-2 text-right">
          <p class="text-xs leading-relaxed">
            با کلیک روی منوی «گزارش‌ها و آرشیو»، به صفحه جامع تحلیل داده‌های تاریخی شلیک‌ها، نمودارهای تاخیر میلی‌ثانیه‌ای و سوابق سرخطی‌های پیشین دسترسی خواهید داشت.
          </p>
          <p class="text-xs font-semibold text-emerald-400 mt-2">
            ✨ تور به پایان رسید! اکنون می‌توانید با تسلط کامل سرخطی بزنید.
          </p>
        </div>
      `,
      side: 'bottom',
      align: 'start',
    },
  },
];

export function startTour() {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayOpacity: 0.75,
    stagePadding: 8,
    stageRadius: 16,
    popoverClass: 'safshekan-tour-popover',
    nextBtnText: 'مرحله بعد ←',
    prevBtnText: '→ مرحله قبل',
    doneBtnText: 'آماده شلیک! 🚀',
    progressText: 'گام {{current}} از {{total}}',
    steps: tourSteps,
    onDestroyStarted: () => {
      try {
        localStorage.setItem('safshekan_tour_completed', 'true');
      } catch {
        // ignore in private mode
      }
      driverObj.destroy();
    },
  });

  driverObj.drive();
  return driverObj;
}

export const startSafshekanTour = startTour;
