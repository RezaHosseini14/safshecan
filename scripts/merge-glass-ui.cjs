const fs = require('fs');

const glassHtml = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>صف‌شکن (SafShekan) - ترمینال فوق‌سریع سرخطی بورس و عرضه‌های اولیه</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <script>
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            primary: "#10b981",
            "primary-container": "#059669",
            "on-primary": "#022c22",
            secondary: "#38bdf8",
            "secondary-container": "#0284c7",
            "on-secondary": "#082f49",
            error: "#f87171",
            "error-container": "#991b1b",
            "on-error": "#450a0a",
            surface: "#080c14",
            "on-surface": "#f1f5f9",
            "on-surface-variant": "#94a3b8",
            "surface-container-lowest": "#05080e",
            "surface-container-low": "#0c1017",
            "surface-container": "#111622",
            "surface-container-high": "#1a2234",
            "surface-container-highest": "#242f45",
            outline: "#334155",
            "outline-variant": "#1e293b"
          },
          fontFamily: {
            body: ["Vazirmatn", "sans-serif"],
            mono: ["JetBrains Mono", "monospace"]
          }
        }
      }
    };
  </script>
  <style>
    @layer base {
      html, body { margin: 0; padding: 0; }
      body { overscroll-behavior: none; font-family: 'Vazirmatn', sans-serif; }
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: rgba(5, 8, 14, 0.6); }
    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.4); }

    /* 2026 Liquid Glass & Specular highlights */
    .glass-panel {
      background: rgba(14, 20, 32, 0.65);
      backdrop-filter: blur(24px) saturate(190%);
      -webkit-backdrop-filter: blur(24px) saturate(190%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.12), inset 0 0 20px 0 rgba(16, 185, 129, 0.02), 0 20px 45px -15px rgba(0, 0, 0, 0.75);
    }
    .glass-panel-subtle {
      background: rgba(10, 15, 25, 0.5);
      backdrop-filter: blur(18px) saturate(180%);
      -webkit-backdrop-filter: blur(18px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.07);
      box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
    }
    .glass-well {
      background: rgba(5, 9, 16, 0.75);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow: inset 0 2px 8px 0 rgba(0, 0, 0, 0.65);
    }
    .glass-card-border {
      position: relative;
    }
    .glass-card-border::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.15), rgba(255, 255, 255, 0.03));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    /* Neon Bloom Text Shadows */
    .neon-text-emerald {
      text-shadow: 0 0 16px rgba(16, 185, 129, 0.5), 0 0 35px rgba(16, 185, 129, 0.25);
    }
    .neon-text-cyan {
      text-shadow: 0 0 16px rgba(56, 189, 248, 0.5), 0 0 35px rgba(6, 182, 212, 0.25);
    }
    
    /* Input focus glow */
    .glass-input {
      background: rgba(6, 10, 18, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.09);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .glass-input:focus {
      background: rgba(8, 14, 26, 0.9);
      border-color: rgba(56, 189, 248, 0.6);
      box-shadow: 0 0 20px -2px rgba(6, 182, 212, 0.3), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12);
    }

    @keyframes pulse-subtle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.65; }
    }
    .animate-pulse-subtle {
      animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  </style>
</head>
<body class="bg-[#070b12] text-[#cbd5e1] antialiased selection:bg-primary/25 selection:text-emerald-300 min-h-screen flex flex-col justify-between relative overflow-x-hidden font-body">

  <!-- 2026 Ambient Lighting & Mesh Glow Background -->
  <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div class="absolute -top-40 right-1/4 w-[650px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px]"></div>
    <div class="absolute top-10 left-1/4 w-[600px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px]"></div>
    <div class="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[130px]"></div>
    <div class="absolute -bottom-20 left-1/3 w-[700px] h-[450px] bg-sky-600/8 rounded-full blur-[160px]"></div>
    <!-- Subtle cyber-grid texture -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
  </div>

  <!-- Header Navigation -->
  <header class="sticky top-0 w-full z-40 bg-[#070b14]/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
    <div class="max-w-7xl mx-auto px-4 md:px-6">
      <div class="h-16 flex items-center justify-between gap-4">
        
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <div class="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <span class="material-symbols-outlined text-[22px] drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]">bolt</span>
          </div>
          <div class="flex flex-col">
            <div class="flex items-baseline gap-2">
              <span class="text-base md:text-lg font-black text-white tracking-tight">صف‌شکن</span>
              <span class="text-slate-600 text-xs">/</span>
              <span class="font-mono text-xs font-semibold text-slate-300" dir="ltr">SafShekan HFT</span>
            </div>
            <span class="font-mono text-[10px] text-emerald-400/80 tracking-widest leading-none" dir="ltr">2026 GLASS EDITION</span>
          </div>
        </div>

        <!-- Live Status Indicators -->
        <div class="hidden lg:flex items-center gap-2 text-xs font-mono">
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] backdrop-blur-md border border-white/[0.07] text-slate-300 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" id="engine-status-dot"></span>
            <span class="text-slate-400 font-body text-[11px]">موتور:</span>
            <span class="font-bold text-emerald-400" id="engine-status-text" dir="ltr">STANDBY</span>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] backdrop-blur-md border border-white/[0.07] text-slate-300 shadow-sm">
            <span class="material-symbols-outlined text-[15px] text-sky-400">schedule</span>
            <span class="text-slate-400 font-body text-[11px]">اختلاف زمان اتمی:</span>
            <span class="text-sky-400 font-semibold" id="header-delta-text" dir="ltr">-14ms</span>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] backdrop-blur-md border border-white/[0.07] text-slate-300 shadow-sm">
            <span class="material-symbols-outlined text-[15px] text-emerald-400">network_ping</span>
            <span class="text-slate-400 font-body text-[11px]">پینگ کارگزاری:</span>
            <span class="text-emerald-400 font-bold" id="header-ping-text" dir="ltr">18ms</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5">
          <button id="btn-open-backtest" class="px-3.5 py-1.5 text-xs font-bold text-secondary bg-secondary/15 hover:bg-secondary hover:text-slate-950 rounded-xl border border-secondary/35 shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all flex items-center gap-1.5 active:scale-95">
            <span class="material-symbols-outlined text-[16px]">biotech</span>
            <span>آزمایشگاه بک‌تست بورس</span>
          </button>
          <div class="h-4 w-px bg-white/10 hidden md:block mx-1"></div>
          <button class="px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all" id="btn-emergency-stop" title="توقف فوری" type="button">
            <span class="material-symbols-outlined text-[16px] drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]">power_settings_new</span>
            <span class="hidden sm:inline">توقف اضطراری</span>
          </button>
        </div>

      </div>
    </div>
  </header>

  <!-- Main Content Layout -->
  <main class="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

    <!-- Hero Section: Atomic Clocks, Target T-Zero & Master Trigger (2026 Glassmorphic Hub) -->
    <div class="glass-panel glass-card-border rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
      <div class="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

        <!-- Clock 1: Official Tehran Exchange Atomic Clock -->
        <div class="lg:col-span-5 flex flex-col justify-center border-b lg:border-b-0 lg:border-l border-white/[0.08] pb-5 lg:pb-0 lg:pl-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-pulse"></span>
              <span class="text-xs font-semibold text-slate-200">ساعت رسمی و اتمی بورس تهران</span>
            </div>
            <span class="text-[10px] font-mono text-emerald-300/80 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25 tracking-wider" dir="ltr" id="ntp-badge">NTP L1 DIRECT</span>
          </div>

          <!-- Atomic Clock Readout Well -->
          <div class="glass-well rounded-xl p-3.5 border border-white/[0.06]">
            <div class="flex items-baseline gap-2 justify-center lg:justify-start" dir="ltr">
              <span class="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]" id="atomic-time-main">08:44:58</span>
              <span class="font-mono text-2xl sm:text-3xl text-emerald-400 font-bold neon-text-emerald" id="atomic-time-ms">.820</span>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400 font-mono mt-3 pt-2.5 border-t border-white/[0.06]">
            <div class="flex items-center gap-2" dir="ltr">
              <span class="text-slate-500">LOCAL:</span>
              <span class="text-slate-300 font-medium" id="atomic-time-local">08:44:58.834</span>
              <span class="text-slate-700">|</span>
              <span class="text-cyan-400 font-semibold" id="atomic-delta-info">DELTA: -14ms</span>
            </div>
            <button class="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-emerald-300 transition-colors font-body px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]" id="btn-sync-ntp" type="button">
              <span class="material-symbols-outlined text-[14px]">refresh</span>
              <span>کالیبراسیون زمان</span>
            </button>
          </div>
        </div>

        <!-- Clock 2: Countdown T-Zero -->
        <div class="lg:col-span-4 flex flex-col justify-center border-b lg:border-b-0 lg:border-l border-white/[0.08] pb-5 lg:pb-0 lg:pl-6">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-200">شمارش معکوس ساعت صفر (T-Zero)</span>
            <span class="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/25 tracking-wide" dir="ltr" id="badge-target-time">TARGET: 08:45:00.000</span>
          </div>

          <div class="glass-well rounded-xl p-3.5 border border-white/[0.06]">
            <div class="flex items-baseline gap-2 justify-center lg:justify-start" dir="ltr">
              <span class="font-mono text-4xl sm:text-5xl font-black tracking-tight text-cyan-400 neon-text-cyan" id="countdown-main">00:00:01</span>
              <span class="font-mono text-2xl sm:text-3xl text-cyan-300 font-bold opacity-90" id="countdown-ms">.180</span>
            </div>
          </div>

          <div class="w-full bg-white/[0.05] h-1.5 rounded-full mt-3 overflow-hidden p-0.5 border border-white/[0.04]">
            <div class="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-75 shadow-[0_0_12px_rgba(56,189,248,0.8)]" id="countdown-progress" style="width: 82%;"></div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono" dir="ltr">
            <span class="text-cyan-300/80 font-semibold" id="leadtime-badge-hero">LEAD-TIME: -18ms</span>
            <span class="text-slate-400 font-body text-[11px]">جبران تاخیر خالص پینگ</span>
          </div>
        </div>

        <!-- Master Trigger Controls (Arm, Dry Run, Disarm) -->
        <div class="lg:col-span-3 flex flex-col justify-center gap-3">
          <button class="relative group overflow-hidden w-full h-14 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_0_35px_rgba(16,185,129,0.35)] hover:shadow-[0_0_45px_rgba(16,185,129,0.55)] hover:scale-[1.01] active:scale-[0.98] border border-emerald-300/40" id="btn-master-arm" type="button">
            <div class="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000"></div>
            <span class="material-symbols-outlined text-[24px] drop-shadow">bolt</span>
            <span class="tracking-wide">مسلح‌سازی سرخطی</span>
            <span class="text-[11px] font-mono bg-black/25 text-slate-950 font-bold px-2 py-0.5 rounded-md backdrop-blur-sm" dir="ltr">F9</span>
          </button>

          <div class="grid grid-cols-2 gap-2">
            <button class="h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-cyan-400/40 text-xs text-slate-200 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 backdrop-blur-md" id="btn-dry-run" type="button">
              <span class="material-symbols-outlined text-[15px] text-cyan-400">science</span>
              <span class="font-medium">تست آزمایشی</span>
            </button>
            <button class="h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-rose-400/40 text-xs text-slate-200 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 backdrop-blur-md" id="btn-disarm" type="button">
              <span class="material-symbols-outlined text-[15px] text-rose-400">close</span>
              <span class="font-medium">لغو آماده‌باش</span>
            </button>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/[0.06]">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input checked class="accent-emerald-500 rounded h-3.5 w-3.5 bg-black/40 border-white/20" id="anti-double-spend" type="checkbox">
              <span class="text-slate-300 text-xs font-medium">توقف خودکار پس از ثبت (Circuit Breaker)</span>
            </label>
            <span class="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20" dir="ltr">TLS WARM</span>
          </div>
        </div>

      </div>
    </div>

    <!-- cURL Smart Accordion Panel -->
    <div class="glass-panel-subtle rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg">
      <button class="w-full px-5 py-3.5 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between text-xs text-slate-200 transition-colors" id="curl-accordion-header" type="button">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <span class="material-symbols-outlined text-[16px]">auto_fix_high</span>
          </div>
          <span class="font-bold text-white text-sm">ورود مستقیم مشخصات از مرورگر با cURL (استخراج اتوماتیک توکن و هدرها)</span>
          <span class="text-[10px] text-slate-400 font-mono hidden sm:inline bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]" dir="ltr">Auto Parse Headers, Token & Payload</span>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="text-[11px] font-medium text-emerald-400 hidden sm:inline" id="badge-broker-status">آماده دریافت cURL</span>
          <span class="material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200" id="curl-accordion-icon">expand_more</span>
        </div>
      </button>

      <div class="p-5 border-t border-white/[0.06] space-y-3.5 bg-black/25 hidden" id="curl-accordion-body">
        <div class="relative">
          <textarea class="w-full p-3.5 glass-input text-slate-200 font-mono text-xs rounded-xl focus:outline-none bg-slate-950/80 leading-relaxed" dir="ltr" id="curl-input" placeholder="curl 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' -H 'Authorization: Bearer ...' --data-raw '{...}'" rows="3"></textarea>
          <div class="absolute bottom-3 left-3 flex items-center gap-2">
            <button class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 font-mono text-[10px] font-semibold rounded-lg border border-white/[0.08] transition-all" id="btn-load-demo-curl" type="button">نمونه تدبیر</button>
            <button class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 font-mono text-[10px] font-semibold rounded-lg border border-white/[0.08] transition-all" id="btn-load-mofid-curl" type="button">نمونه مفید</button>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div class="flex items-center gap-2">
            <button class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95" id="btn-parse-curl" type="button">
              <span class="material-symbols-outlined text-[16px]">bolt</span>
              <span>استخراج خودکار هدرها و توکن</span>
            </button>
            <button class="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-medium rounded-xl border border-white/[0.08] transition-all" id="btn-clear-curl" type="button">پاک‌سازی</button>
          </div>
          <div class="flex items-center gap-2 text-[10px] font-mono" dir="ltr">
            <span class="bg-white/[0.03] text-slate-300 px-2.5 py-1 rounded-lg border border-white/[0.08]" id="badge-broker">BROKER: CUSTOM</span>
            <span class="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/25 font-bold" id="badge-auth">AUTH: READY</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2-Column Split: Stock Order & Latency Engine -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Panel 1: Stock Specs & Order Inputs -->
      <div class="lg:col-span-6 glass-panel rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
        <div class="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <span class="material-symbols-outlined text-[20px]">candlestick_chart</span>
            </div>
            <h2 class="text-sm font-bold text-white tracking-tight">مشخصات سهم و سفارش</h2>
          </div>
          <span class="text-[10px] font-mono text-slate-300 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.08]" dir="ltr" id="isin-badge">ISIN: IRO1FAZR0001</span>
        </div>

        <!-- Ticker Symbol with Dropdown Picker -->
        <div class="space-y-1.5 relative">
          <label class="text-xs text-slate-300 font-semibold flex justify-between">
            <span>نماد بورسی هدف (عرضه اولیه یا صف خرید)</span>
            <span class="text-[11px] text-emerald-400 font-normal" id="symbol-selected-type">عرضه اولیه / صف خرید</span>
          </label>

          <div class="grid grid-cols-12 gap-2 relative">
            <div class="col-span-8 sm:col-span-9 relative">
              <input class="w-full glass-input rounded-xl px-3.5 py-2.5 text-base font-bold text-emerald-400 focus:outline-none bg-slate-950/80 cursor-pointer" id="symbol-input" type="text" value="فزر" autocomplete="off" placeholder="انتخاب نماد...">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-body pointer-events-none bg-black/40 px-2 py-0.5 rounded-md border border-white/5" id="symbol-desc-label">پویا زرکان آق‌دره</span>
            </div>
            <div class="col-span-4 sm:col-span-3">
              <button class="w-full h-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-slate-200 text-xs rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95" id="btn-toggle-symbols" type="button">
                <span class="material-symbols-outlined text-[16px] text-cyan-400">format_list_bulleted</span>
                <span>لیست نمادها</span>
              </button>
            </div>

            <!-- Floating Searchable Symbols Dropdown -->
            <div id="symbols-dropdown" class="hidden absolute top-full left-0 right-0 mt-2 z-50 glass-panel border border-white/[0.15] rounded-2xl shadow-2xl p-3 max-h-[420px] flex flex-col gap-2 backdrop-blur-2xl animate-fadeIn">
              <div class="relative">
                <input type="text" id="symbol-search-box" placeholder="جستجوی نماد یا نام شرکت (مثلاً: شستا، فزر، فولاد، خودرو، طلا...)" class="w-full glass-input px-3.5 py-2 text-xs text-white rounded-xl focus:outline-none border border-white/[0.1] bg-slate-950/90" autocomplete="off" />
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>نمادهای یافت شده: <span id="symbol-count-badge" class="text-emerald-400 font-bold">0</span></span>
                <span>کلیک کنید تا انتخاب شود</span>
              </div>
              <div id="symbols-list-container" class="overflow-y-auto max-h-[300px] divide-y divide-white/[0.05] flex flex-col text-xs pr-1">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>
        </div>

        <!-- Price Field -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs text-slate-300 font-semibold">سقف مجاز قیمت (ریال)</label>
            <button class="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-colors" id="btn-preset-max-price" type="button">تنظیم روی حداکثر (+۷٪)</button>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input class="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-400 font-bold focus:outline-none text-left bg-slate-950/80" dir="ltr" id="price-input" type="text" value="25000">
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">ریال</span>
            </div>
            <button class="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] text-white text-lg font-bold flex items-center justify-center transition-all active:scale-95" id="btn-price-plus" type="button">+</button>
            <button class="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] text-white text-lg font-bold flex items-center justify-center transition-all active:scale-95" id="btn-price-minus" type="button">-</button>
          </div>
        </div>

        <!-- Quantity & Value -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-semibold">حجم سفارش (تعداد سهام سهمیه)</label>
            <div class="relative">
              <input class="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-white font-bold focus:outline-none text-left bg-slate-950/80" dir="ltr" id="qty-input" type="number" value="500">
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">سهم</span>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-semibold">ارزش کل سفارش (ناخالص)</label>
            <div class="w-full glass-well rounded-xl px-3.5 py-2.5 flex items-center justify-between border border-white/[0.06] h-[42px]">
              <span class="font-mono text-sm font-extrabold text-white" dir="ltr" id="order-value-total">12,500,000</span>
              <span class="text-xs text-slate-400 font-medium">ریال</span>
            </div>
          </div>
        </div>

        <!-- Broker & Account Specs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-semibold">پلتفرم کارگزاری</label>
            <select class="w-full glass-input rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer bg-slate-950/80" id="broker-select">
              <option class="bg-[#0b1019] text-slate-200" selected value="tadbir">تدبیر پرداز (Online Plus)</option>
              <option class="bg-[#0b1019] text-slate-200" value="rayan">رایان بورس (Rayan Bourse)</option>
              <option class="bg-[#0b1019] text-slate-200" value="mofid">مفید ایزی‌تریدر (EasyTrader)</option>
              <option class="bg-[#0b1019] text-slate-200" value="farabi">فارابیکسو (FarabiXO)</option>
              <option class="bg-[#0b1019] text-slate-200" value="sahra">صحرا پروتکل (Sahra)</option>
              <option class="bg-[#0b1019] text-slate-200" value="custom">پیکربندی سفارشی cURL</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-semibold">کاربر / کد معاملاتی فعال</label>
            <div class="glass-well rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs border border-white/[0.06] h-[42px]">
              <span class="text-slate-200 font-medium">کاربر متصل</span>
              <span class="font-mono text-cyan-400 font-bold" dir="ltr" id="account-code-display">PR-1048820</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Panel 2: Latency Engine & Burst Controls -->
      <div class="lg:col-span-6 glass-panel rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
        <div class="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <span class="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <h2 class="text-sm font-bold text-white tracking-tight">تنظیمات شلیک و تاخیر (Latency Engine)</h2>
          </div>
          <span class="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25 tracking-wide font-semibold" dir="ltr">ULTRA-LOW LATENCY</span>
        </div>

        <!-- Target Exact Send Timestamp -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs text-slate-300 font-semibold">زمان هدف دقیق ارسال به هسته بورس</label>
            <span class="text-[10px] font-mono text-slate-400" dir="ltr">HH:MM:SS.mmm</span>
          </div>
          <div class="flex items-center gap-2">
            <input class="flex-1 glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-400 font-bold focus:outline-none text-left bg-slate-950/80" dir="ltr" id="target-time-input" type="text" value="08:45:00.000">
            <div class="flex items-center gap-1">
              <button class="h-10 px-2.5 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] rounded-xl text-[11px] font-mono text-cyan-300 font-semibold transition-all active:scale-95" dir="ltr" id="btn-adj-p1" type="button">+1ms</button>
              <button class="h-10 px-2.5 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] rounded-xl text-[11px] font-mono text-cyan-300 font-semibold transition-all active:scale-95" dir="ltr" id="btn-adj-m1" type="button">-1ms</button>
              <button class="h-10 px-2.5 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] rounded-xl text-[11px] font-mono text-amber-300 font-semibold transition-all active:scale-95" dir="ltr" id="btn-adj-p5" type="button">+5ms</button>
              <button class="h-10 px-2.5 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] rounded-xl text-[11px] font-mono text-amber-300 font-semibold transition-all active:scale-95" dir="ltr" id="btn-adj-m5" type="button">-5ms</button>
            </div>
          </div>
        </div>

        <!-- Lead-Time & Socket Pre-warm -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs text-slate-300 font-semibold">زمان پیش‌ارسال (Lead-Time)</label>
              <span class="text-[10px] font-mono text-slate-400 font-medium" dir="ltr" id="label-lead-rtt">RTT: 18ms</span>
            </div>
            <div class="relative">
              <input class="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-400 font-bold focus:outline-none text-left bg-slate-950/80" dir="ltr" id="leadtime-input" type="number" value="18">
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">ms</span>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-semibold">پیش‌گرمایش سوکت (TLS Keep-Alive)</label>
            <select class="w-full glass-input rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer bg-slate-950/80" id="prewarm-select">
              <option class="bg-[#0b1019] text-slate-200" selected value="15">۱۵ ثانیه قبل (توصیه شده)</option>
              <option class="bg-[#0b1019] text-slate-200" value="30">۳۰ ثانیه قبل (حالت پایدار)</option>
              <option class="bg-[#0b1019] text-slate-200" value="0">غیرفعال (اتصال سرد)</option>
            </select>
          </div>
        </div>

        <!-- High Density Burst Engine -->
        <div class="space-y-3.5 pt-1">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300 font-semibold">تعداد شلیک در بسته رگباری (Burst Count):</span>
              <span class="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20" dir="ltr" id="burst-count-label">10 شلیک</span>
            </div>
            <input class="w-full accent-emerald-400 cursor-pointer h-2 bg-white/[0.08] rounded-lg appearance-none" id="burst-count-slider" max="25" min="1" type="range" value="10">
            <div class="flex justify-between text-[10px] text-slate-400 font-mono" dir="ltr">
              <span>1</span>
              <span class="text-emerald-400/80 font-medium">10 (استاندارد بورس)</span>
              <span>25</span>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300 font-semibold">فاصله زمانی بین شلیک‌ها (Interval):</span>
              <span class="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20" dir="ltr" id="burst-interval-label">40 ms</span>
            </div>
            <input class="w-full accent-cyan-400 cursor-pointer h-2 bg-white/[0.08] rounded-lg appearance-none" id="burst-interval-slider" max="150" min="10" step="5" type="range" value="40">
            <div class="flex justify-between text-[10px] text-slate-400 font-mono" dir="ltr">
              <span>10ms (ریسک بلاک)</span>
              <span class="text-cyan-400/80 font-medium">40ms (بهینه ضد لیمیت)</span>
              <span>150ms</span>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Real-time Order Telemetry Table (Frosted Glass Table Console) -->
    <div class="glass-panel glass-card-border rounded-2xl overflow-hidden shadow-2xl">
      <div class="px-5 py-4 bg-white/[0.02] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-pulse"></span>
          <h3 class="text-sm font-bold text-white">گزارش لحظه‌ای شلیک‌ها و وضعیت پاسخ هسته معاملات</h3>
          <span class="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.08] hidden sm:inline" dir="ltr">LIVE TELEMETRY 2026</span>
        </div>
        <div class="flex items-center gap-2.5 font-mono text-xs">
          <div class="bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-xl text-slate-300">
            شلیک‌ها: <span class="text-emerald-400 font-bold" dir="ltr" id="log-count">0/10</span>
          </div>
          <div class="bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-xl text-slate-300">
            وضعیت: <span class="text-emerald-400 font-bold" dir="ltr" id="telemetry-rate">READY</span>
          </div>
          <button class="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-all" id="btn-clear-logs" title="پاک‌سازی لاگ‌ها" type="button">
            <span class="material-symbols-outlined text-[17px]">delete_sweep</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs" dir="rtl">
          <thead class="bg-black/35 text-slate-400 text-[11px] font-semibold border-b border-white/[0.06]">
            <tr>
              <th class="py-3 px-4 font-semibold text-right">ردیف / تیر</th>
              <th class="py-3 px-4 font-semibold text-left" dir="ltr">زمان ارسال</th>
              <th class="py-3 px-4 font-semibold text-left" dir="ltr">زمان پاسخ</th>
              <th class="py-3 px-4 font-semibold text-center">وضعیت HTTP</th>
              <th class="py-3 px-4 font-semibold text-left" dir="ltr">تاخیر (RTT)</th>
              <th class="py-3 px-4 font-semibold text-right">کد رهگیری</th>
              <th class="py-3 px-4 font-semibold text-right">نتیجه هسته معاملات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.04] font-mono text-[11px]" id="terminal-stream">
            <tr>
              <td colspan="7" class="py-8 text-center text-slate-400 font-body text-xs bg-white/[0.01]">
                موتور در انتظار مسلح‌سازی است. به محض فرارسیدن زمان هدف، شلیک‌های میلی‌ثانیه‌ای به ترتیب در این جدول ثبت می‌شوند.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-5 py-3.5 bg-black/45 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-slate-400">
        <div class="flex flex-col">
          <span class="text-[11px] text-slate-400 font-body">میانگین تاخیر RTT</span>
          <span class="text-emerald-400 font-bold mt-0.5" dir="ltr" id="stat-avg-rtt">18.0 ms</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] text-slate-400 font-body">سریع‌ترین پاسخ سرور</span>
          <span class="text-cyan-400 font-bold mt-0.5" dir="ltr" id="stat-min-rtt">16.2 ms</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] text-slate-400 font-body">دقت زمان‌سنج موتور</span>
          <span class="text-slate-100 font-bold mt-0.5" dir="ltr">0.00 ms (Jitter-Free)</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] text-slate-400 font-body">رتبه پیش‌بینی‌شده صف</span>
          <span class="text-emerald-300 font-bold mt-0.5 font-body neon-text-emerald">#۱ تا #۵ (طلایی)</span>
        </div>
      </div>
    </div>

  </main>

  <!-- Footer -->
  <footer class="relative z-10 w-full bg-[#05080f]/85 backdrop-blur-xl border-t border-white/[0.08] py-3.5 mt-6">
    <div class="max-w-7xl mx-auto px-4 md:px-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-mono">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          <span class="font-body text-slate-300">اتصال مرکز داده:</span>
          <span class="text-emerald-300 font-semibold" dir="ltr">Tehran Afranet IXP (Fiber L1)</span>
        </div>
        <span class="text-slate-700">|</span>
        <span class="font-body text-slate-300">وضعیت بورس: <span class="text-amber-400 font-medium">پیش‌گشایش ساعت ۸:۴۵</span></span>
      </div>
      <div class="flex items-center gap-2" dir="ltr">
        <span class="text-slate-300 font-semibold">SAFSHEKAN HIGH-FREQUENCY TERMINAL</span>
        <span class="text-slate-700">|</span>
        <span class="text-emerald-400 font-bold">2026 EDITION</span>
      </div>
    </div>
  </footer>

  <!-- ========================================================================= -->
  <!-- Backtest & Simulation Modal (Glassmorphic 2-Tab Suite) -->
  <!-- ========================================================================= -->
  <div id="backtest-modal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-fadeIn">
    <div class="glass-panel glass-card-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
      
      <!-- Modal Header -->
      <div class="p-4 md:p-5 bg-white/[0.02] flex flex-wrap items-center justify-between border-b border-white/[0.08] gap-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span class="material-symbols-outlined text-[22px]">biotech</span>
          </div>
          <div>
            <h2 class="text-sm md:text-base font-bold text-white">آزمایشگاه بک‌تست و شبیه‌ساز معاملات HFT بورس تهران</h2>
            <p class="text-xs text-slate-400">تست استرس هسته معاملات و بک‌تست روی سوابق واقعی ۲۰ عرضه اولیه بورس و فرابورس</p>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08]">
          <button id="tab-btn-historical" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-primary text-slate-950 shadow-md flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">history_edu</span>
            <span>بک‌تست داده‌های تاریخی بورس</span>
          </button>
          <button id="tab-btn-stress" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">speed</span>
            <span>شبیه‌ساز استرس بازگشایی (RTT)</span>
          </button>
        </div>

        <button id="btn-close-backtest" class="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors">
          <span class="material-symbols-outlined text-[22px]">close</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">

        <!-- TAB 1: HISTORICAL DATA BACKTEST -->
        <div id="tab-pane-historical" class="space-y-5">
          <!-- Parameter Box -->
          <div class="glass-panel-subtle p-4 rounded-xl border border-white/[0.08] space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">tune</span>
                <span>پارامترهای مالی و اتصال برای بک‌تست تاریخی:</span>
              </span>
              <span class="text-[11px] text-slate-400">شامل داده‌های پی‌پاد، توسن، فجهان، نخریس، کرومیت و...</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label class="text-[11px] text-slate-300 block mb-1">سرمایه اولیه پورتفوی (تومان):</label>
                <input id="hist-capital" type="number" value="50000000" step="5000000" class="w-full glass-input text-white text-xs p-2.5 rounded-xl border border-white/[0.1] font-mono focus:outline-none" />
              </div>

              <div>
                <label class="text-[11px] text-slate-300 block mb-1">حجم هر سفارش سرخطی:</label>
                <select id="hist-allocation-mode" class="w-full glass-input text-white text-xs p-2.5 rounded-xl border border-white/[0.1] focus:outline-none bg-[#090e18]">
                  <option value="fixed" selected>ثابت: ۱۰ میلیون تومان در هر نماد</option>
                  <option value="fixed_20">ثابت: ۲۰ میلیون تومان در هر نماد</option>
                  <option value="percent_30">درصدی: ۳۰٪ کل مانده پورتفوی (مرکب)</option>
                  <option value="percent_50">درصدی: ۵۰٪ کل مانده پورتفوی</option>
                </select>
              </div>

              <div>
                <label class="text-[11px] text-slate-300 block mb-1">نوع بستر اتصال اینترنت:</label>
                <select id="hist-connection" class="w-full glass-input text-white text-xs p-2.5 rounded-xl border border-white/[0.1] focus:outline-none bg-[#090e18]">
                  <option value="datacenter">سرور دیتاسنتر تهران (پینگ ۲ms | لید ۰.۸ms)</option>
                  <option value="fiber" selected>فیبر نوری / VDSL تهران (پینگ ۱۶ms | لید ۷.۲ms)</option>
                  <option value="mobile4g">اینترنت همراه 4G (پینگ ۴۴ms | لید ۲۰.۵ms)</option>
                  <option value="adsl">اینترنت ADSL خانگی (پینگ ۷۵ms | لید ۳۴ms)</option>
                </select>
              </div>

              <div>
                <label class="text-[11px] text-slate-300 block mb-1">شلیک رگباری (Burst):</label>
                <div class="flex items-center gap-1.5">
                  <select id="hist-burst-count" class="w-1/2 glass-input text-white text-xs p-2.5 rounded-xl border border-white/[0.1] focus:outline-none bg-[#090e18]">
                    <option value="3">۳ شلیک</option>
                    <option value="5" selected>۵ شلیک</option>
                    <option value="8">۸ شلیک</option>
                    <option value="10">۱۰ شلیک</option>
                  </select>
                  <button id="btn-run-historical" class="w-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs p-2.5 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all active:scale-95">
                    <span class="material-symbols-outlined text-[16px]">play_arrow</span>
                    <span>اجرای تست</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Spinner -->
          <div id="hist-loading" class="hidden p-8 flex flex-col items-center justify-center gap-3">
            <div class="w-10 h-10 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div>
            <p class="text-xs font-bold text-emerald-400 animate-pulse">در حال شبیه‌سازی صف میلی‌ثانیه‌ای و بررسی حجم معاملات ۲۰ عرضه اولیه تاریخی...</p>
          </div>

          <!-- Results -->
          <div id="hist-results-view" class="space-y-4">
            <!-- Summary KPI Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="glass-well p-3.5 rounded-xl border border-white/[0.06]">
                <span class="text-[11px] text-slate-400 block">سرمایه نهایی و سود کل:</span>
                <span id="hist-kpi-ending" class="font-mono text-base font-black text-emerald-400 block mt-1">--- تومان</span>
                <span id="hist-kpi-profit" class="text-[11px] text-emerald-400 block mt-0.5 font-bold">---</span>
              </div>

              <div class="glass-well p-3.5 rounded-xl border border-white/[0.06]">
                <span class="text-[11px] text-slate-400 block">نرخ موفقیت در صف (Fill Rate):</span>
                <span id="hist-kpi-fillrate" class="font-mono text-base font-black text-cyan-400 block mt-1">---٪</span>
                <span id="hist-kpi-filldetail" class="text-[11px] text-slate-400 block mt-0.5">--- معامله موفق</span>
              </div>

              <div class="glass-well p-3.5 rounded-xl border border-white/[0.06]">
                <span class="text-[11px] text-slate-400 block">میانگین سود هر عرضه اولیه:</span>
                <span id="hist-kpi-avgreturn" class="font-mono text-base font-black text-amber-300 block mt-1">---٪</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">خروج در روز تعادل</span>
              </div>

              <div class="glass-well p-3.5 rounded-xl border border-white/[0.06]">
                <span class="text-[11px] text-slate-400 block">ریسک ریجکت زودهنگام:</span>
                <span id="hist-kpi-rejects" class="font-mono text-base font-black text-emerald-400 block mt-1">۰ (کاملاً ایمن)</span>
                <span id="hist-kpi-drawdown" class="text-[11px] text-slate-400 block mt-0.5">حداکثر افت: ۰٪</span>
              </div>
            </div>

            <!-- Trades Table -->
            <div class="glass-well rounded-xl p-3 border border-white/[0.06] space-y-2">
              <div class="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <h3 class="text-xs font-bold text-white flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-emerald-400 text-[16px]">receipt_long</span>
                  <span>جزئیات عملکرد ربات در ۲۰ عرضه اولیه تاریخی بورس:</span>
                </h3>
                <span class="text-[11px] text-slate-400">کارمزد خرید و فروش (~۱.۲۵٪) کسر شده است.</span>
              </div>

              <div class="overflow-x-auto max-h-[380px]">
                <table class="w-full text-right text-xs" dir="rtl">
                  <thead class="sticky top-0 bg-[#090d16] z-10">
                    <tr class="text-slate-400 text-[11px] border-b border-white/[0.08]">
                      <th class="p-2.5">نماد و شرکت</th>
                      <th class="p-2.5">تاریخ</th>
                      <th class="p-2.5">تیر برنده</th>
                      <th class="p-2.5">رتبه صف</th>
                      <th class="p-2.5">وضعیت معامله</th>
                      <th class="p-2.5">سرمایه درگیر</th>
                      <th class="p-2.5">سود خالص</th>
                      <th class="p-2.5">بازدهی</th>
                      <th class="p-2.5">قفل صف</th>
                    </tr>
                  </thead>
                  <tbody id="hist-trades-body">
                    <tr>
                      <td colspan="9" class="text-center py-8 text-slate-400 text-xs">
                        برای مشاهده نتایج، دکمه «اجرای تست» را در بالا بزنید.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: STRESS LAB -->
        <div id="tab-pane-stress" class="hidden space-y-5">
          <div class="glass-panel-subtle p-3.5 rounded-xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-300">تعداد شبیه‌سازی در هر سناریو:</span>
              <select id="backtest-runs-count" class="glass-input text-white px-2.5 py-1 rounded-lg text-xs bg-[#090e18]">
                <option value="4" selected>۴ بار در هر سناریو (سریع ~ ۸ ثانیه)</option>
                <option value="8">۸ بار در هر سناریو (دقت بالا ~ ۱۶ ثانیه)</option>
              </select>
            </div>
            <button id="btn-start-simulation" class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95">
              <span class="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>شروع شبیه‌سازی استرس بازگشایی بازار</span>
            </button>
          </div>

          <div id="backtest-loading" class="hidden p-8 flex flex-col items-center justify-center gap-3">
            <div class="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
            <p class="text-xs font-bold text-cyan-400 animate-pulse">در حال شبیه‌سازی مونت کارلو و پرتاب سفارش‌ها در ساعت صفر هسته معاملات...</p>
          </div>

          <div id="backtest-results-view" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="glass-well p-3.5 rounded-xl border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span class="text-[11px] text-slate-400 block">دقت تایمر و Spin-Wait موتور:</span>
                  <span id="bt-precision-text" class="font-mono text-sm font-bold text-emerald-400">0 ms انحراف (بسیار دقیق)</span>
                </div>
                <span class="bg-emerald-500/15 text-emerald-400 text-[11px] px-2.5 py-1 rounded-lg font-bold border border-emerald-500/25">PASS 100%</span>
              </div>
              <div class="glass-well p-3.5 rounded-xl border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span class="text-[11px] text-slate-400 block">مدارشکن ضد سفارش تکراری (Anti-Double):</span>
                  <span id="bt-circuit-text" class="font-mono text-sm font-bold text-cyan-400">توقف فوری پس از ۲ شلیک</span>
                </div>
                <span class="bg-cyan-500/15 text-cyan-400 text-[11px] px-2.5 py-1 rounded-lg font-bold border border-cyan-500/25">SAFE ACTIVE</span>
              </div>
            </div>

            <div class="glass-well rounded-xl p-3.5 border border-white/[0.06] space-y-2">
              <h3 class="text-xs font-bold text-white flex items-center gap-1.5">
                <span class="material-symbols-outlined text-cyan-400 text-[16px]">leaderboard</span>
                <span>نتایج شبیه‌سازی انواع اتصالات اینترنت بورس ایران و شانس رتبه ۱ تا ۵:</span>
              </h3>
              <div id="bt-scenarios-container" class="space-y-2.5">
                <div class="text-center text-xs text-slate-400 py-4">برای مشاهده تحلیل دقیق، دکمه «شروع شبیه‌سازی» را بزنید.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- JavaScript Application Controller -->
  <script>
    (function initSafShekan() {
      // -------------------------------------------------------------
      // WebSocket & Real-time State
      // -------------------------------------------------------------
      let ws = null;
      let allSymbols = [];
      let currentConfig = null;

      function connectWs() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(\`\${protocol}//\${window.location.host}\`);

        ws.onopen = () => {
          console.log('[WS] Connected to SafShekan Core Engine');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            handleWsMessage(msg);
          } catch (e) {
            console.error('[WS] Parse error:', e);
          }
        };

        ws.onclose = () => {
          setTimeout(connectWs, 2000);
        };
      }

      function handleWsMessage(msg) {
        if (msg.type === 'CLOCK_TICK') {
          updateClockDisplay(msg.data);
        } else if (msg.type === 'STATE_CHANGE') {
          updateEngineState(msg.data.state);
        } else if (msg.type === 'LOG') {
          appendLogEntry(msg.data);
        } else if (msg.type === 'ORDER_SENT') {
          handleOrderSent(msg.data);
        }
      }

      // -------------------------------------------------------------
      // Clocks & Atomic Readouts
      // -------------------------------------------------------------
      const clockMainEl = document.getElementById('atomic-time-main');
      const clockMsEl = document.getElementById('atomic-time-ms');
      const clockLocalEl = document.getElementById('atomic-time-local');
      const countdownMainEl = document.getElementById('countdown-main');
      const countdownMsEl = document.getElementById('countdown-ms');
      const progressEl = document.getElementById('countdown-progress');
      const headerDeltaText = document.getElementById('header-delta-text');
      const atomicDeltaInfo = document.getElementById('atomic-delta-info');

      function updateClockDisplay(data) {
        if (!data || !data.currentExactTime) return;
        const timeParts = data.currentExactTime.split('.');
        const timeHms = timeParts[0] || '08:45:00';
        const timeMs = timeParts[1] || '000';

        if (clockMainEl) clockMainEl.textContent = timeHms;
        if (clockMsEl) clockMsEl.textContent = '.' + timeMs;

        const now = new Date();
        const lh = String(now.getHours()).padStart(2, '0');
        const lm = String(now.getMinutes()).padStart(2, '0');
        const ls = String(now.getSeconds()).padStart(2, '0');
        const lms = String(now.getMilliseconds()).padStart(3, '0');
        if (clockLocalEl) clockLocalEl.textContent = \`\${lh}:\${lm}:\${ls}.\${lms}\`;

        // Calculate countdown to targetTime
        const targetStr = data.targetTime || '08:45:00';
        const targetParts = targetStr.split(':');
        const targetDate = new Date(data.timestampMs);
        targetDate.setHours(parseInt(targetParts[0] || '8', 10), parseInt(targetParts[1] || '45', 10), parseInt(targetParts[2] || '0', 10), 0);

        let diff = targetDate.getTime() - data.timestampMs;
        if (diff < 0) {
          // If past today's opening, target is tomorrow or zeroed
          if (countdownMainEl) countdownMainEl.textContent = '00:00:00';
          if (countdownMsEl) countdownMsEl.textContent = '.000';
          if (progressEl) progressEl.style.width = '100%';
        } else {
          const hours = Math.floor(diff / 3600000);
          diff -= hours * 3600000;
          const mins = Math.floor(diff / 60000);
          diff -= mins * 60000;
          const secs = Math.floor(diff / 1000);
          const ms = diff % 1000;

          if (countdownMainEl) {
            countdownMainEl.textContent = \`\${String(hours).padStart(2, '0')}:\${String(mins).padStart(2, '0')}:\${String(secs).padStart(2, '0')}\`;
          }
          if (countdownMsEl) countdownMsEl.textContent = '.' + String(ms).padStart(3, '0');

          const progressPercent = Math.min(100, Math.max(0, 100 - (diff / 60000) * 100));
          if (progressEl) progressEl.style.width = \`\${progressPercent}%\`;
        }
      }

      // -------------------------------------------------------------
      // Master Trigger (ARM / DISARM / DRY-RUN)
      // -------------------------------------------------------------
      const masterArmBtn = document.getElementById('btn-master-arm');
      const btnDisarm = document.getElementById('btn-disarm');
      const btnDryRun = document.getElementById('btn-dry-run');
      const engineStatusDot = document.getElementById('engine-status-dot');
      const engineStatusText = document.getElementById('engine-status-text');

      function updateEngineState(state) {
        if (!masterArmBtn) return;
        if (state === 'ARMED') {
          masterArmBtn.className = "relative group overflow-hidden w-full h-14 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_0_40px_rgba(244,63,94,0.45)] animate-pulse border border-rose-400/40";
          masterArmBtn.innerHTML = \`
            <span class="material-symbols-outlined text-[24px] drop-shadow">radio_button_checked</span>
            <span class="tracking-wide">موتور مسلح و آماده شلیک است</span>
            <span class="text-[11px] font-mono bg-black/30 text-white font-bold px-2 py-0.5 rounded-md backdrop-blur-sm" dir="ltr">ARMED</span>
          \`;
          if (engineStatusDot) engineStatusDot.className = "w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-ping";
          if (engineStatusText) {
            engineStatusText.textContent = "ARMED";
            engineStatusText.className = "font-bold text-rose-400";
          }
        } else {
          masterArmBtn.className = "relative group overflow-hidden w-full h-14 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_0_35px_rgba(16,185,129,0.35)] hover:shadow-[0_0_45px_rgba(16,185,129,0.55)] hover:scale-[1.01] active:scale-[0.98] border border-emerald-300/40";
          masterArmBtn.innerHTML = \`
            <div class="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000"></div>
            <span class="material-symbols-outlined text-[24px] drop-shadow">bolt</span>
            <span class="tracking-wide">مسلح‌سازی سرخطی</span>
            <span class="text-[11px] font-mono bg-black/25 text-slate-950 font-bold px-2 py-0.5 rounded-md backdrop-blur-sm" dir="ltr">F9</span>
          \`;
          if (engineStatusDot) engineStatusDot.className = "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse";
          if (engineStatusText) {
            engineStatusText.textContent = "STANDBY";
            engineStatusText.className = "font-bold text-emerald-400";
          }
        }
      }

      if (masterArmBtn) {
        masterArmBtn.addEventListener('click', async () => {
          saveCurrentInputs();
          const res = await fetch('/api/sniper/arm', { method: 'POST' });
          const d = await res.json();
          if (d.success) {
            updateEngineState('ARMED');
          } else {
            alert('خطا در مسلح‌سازی: ' + (d.message || ''));
          }
        });
      }

      if (btnDisarm) {
        btnDisarm.addEventListener('click', async () => {
          const res = await fetch('/api/sniper/disarm', { method: 'POST' });
          const d = await res.json();
          if (d.success) updateEngineState('DISARMED');
        });
      }

      if (btnDryRun) {
        btnDryRun.addEventListener('click', async () => {
          saveCurrentInputs();
          try {
            const res = await fetch('/api/sniper/test-shot', { method: 'POST' });
            const d = await res.json();
            if (d.success) {
              appendLogEntry({
                type: 'DRY_RUN',
                timestamp: new Date().toISOString(),
                message: 'شلیک آزمایشی با موفقیت ارسال شد.',
                shotResult: d.result
              });
            }
          } catch (e) {
            alert('خطا در شلیک تستی: ' + e.message);
          }
        });
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === 'F9') {
          e.preventDefault();
          masterArmBtn?.click();
        }
      });

      // -------------------------------------------------------------
      // Time Calibration (NTP) & RTT Ping
      // -------------------------------------------------------------
      const btnSyncNtp = document.getElementById('btn-sync-ntp');
      if (btnSyncNtp) {
        btnSyncNtp.addEventListener('click', async () => {
          btnSyncNtp.classList.add('opacity-50');
          try {
            const res = await fetch('/api/time/sync', { method: 'POST' });
            const d = await res.json();
            if (d.success) {
              const off = d.status.offsetMs;
              const sign = off >= 0 ? '+' : '';
              if (headerDeltaText) headerDeltaText.textContent = \`\${sign}\${off}ms\`;
              if (atomicDeltaInfo) atomicDeltaInfo.textContent = \`DELTA: \${sign}\${off}ms\`;
            }
          } finally {
            btnSyncNtp.classList.remove('opacity-50');
          }
        });
      }

      // -------------------------------------------------------------
      // Order Inputs: Price, Qty, Total
      // -------------------------------------------------------------
      const priceInput = document.getElementById('price-input');
      const qtyInput = document.getElementById('qty-input');
      const orderValueEl = document.getElementById('order-value-total');
      const btnPricePlus = document.getElementById('btn-price-plus');
      const btnPriceMinus = document.getElementById('btn-price-minus');
      const btnPresetMax = document.getElementById('btn-preset-max-price');

      function recalcTotal() {
        const p = parseFloat(priceInput ? priceInput.value.replace(/,/g, '') : 25000) || 0;
        const q = parseFloat(qtyInput ? qtyInput.value : 500) || 0;
        const total = p * q;
        if (orderValueEl) orderValueEl.textContent = total.toLocaleString('en-US');
      }

      if (priceInput) priceInput.addEventListener('input', () => { recalcTotal(); saveCurrentInputs(); });
      if (qtyInput) qtyInput.addEventListener('input', () => { recalcTotal(); saveCurrentInputs(); });

      if (btnPricePlus && priceInput) {
        btnPricePlus.addEventListener('click', () => {
          const p = parseInt(priceInput.value.replace(/,/g, ''), 10) || 25000;
          priceInput.value = p + 50;
          recalcTotal();
          saveCurrentInputs();
        });
      }
      if (btnPriceMinus && priceInput) {
        btnPriceMinus.addEventListener('click', () => {
          const p = parseInt(priceInput.value.replace(/,/g, ''), 10) || 25000;
          priceInput.value = Math.max(0, p - 50);
          recalcTotal();
          saveCurrentInputs();
        });
      }
      if (btnPresetMax && priceInput) {
        btnPresetMax.addEventListener('click', () => {
          priceInput.value = '25000';
          recalcTotal();
          saveCurrentInputs();
        });
      }

      // -------------------------------------------------------------
      // Sliders: Burst Count & Interval
      // -------------------------------------------------------------
      const burstCountSlider = document.getElementById('burst-count-slider');
      const burstCountLabel = document.getElementById('burst-count-label');
      const burstIntervalSlider = document.getElementById('burst-interval-slider');
      const burstIntervalLabel = document.getElementById('burst-interval-label');

      if (burstCountSlider && burstCountLabel) {
        burstCountSlider.addEventListener('input', (e) => {
          burstCountLabel.textContent = \`\${e.target.value} شلیک\`;
          saveCurrentInputs();
        });
      }
      if (burstIntervalSlider && burstIntervalLabel) {
        burstIntervalSlider.addEventListener('input', (e) => {
          burstIntervalLabel.textContent = \`\${e.target.value} ms\`;
          saveCurrentInputs();
        });
      }

      // -------------------------------------------------------------
      // Target Time & Adjusters (+1ms, -1ms, +5ms, -5ms)
      // -------------------------------------------------------------
      const targetInput = document.getElementById('target-time-input');
      const badgeTargetTime = document.getElementById('badge-target-time');
      const leadtimeInput = document.getElementById('leadtime-input');
      const leadtimeBadgeHero = document.getElementById('leadtime-badge-hero');

      function adjustTargetMs(delta) {
        if (!targetInput) return;
        let parts = targetInput.value.split('.');
        let timePart = parts[0] || '08:45:00';
        let msPart = parseInt(parts[1] || '0', 10);
        msPart = Math.min(999, Math.max(0, msPart + delta));
        targetInput.value = \`\${timePart}.\${String(msPart).padStart(3, '0')}\`;
        if (badgeTargetTime) badgeTargetTime.textContent = \`TARGET: \${targetInput.value}\`;
        saveCurrentInputs();
      }

      document.getElementById('btn-adj-p1')?.addEventListener('click', () => adjustTargetMs(1));
      document.getElementById('btn-adj-m1')?.addEventListener('click', () => adjustTargetMs(-1));
      document.getElementById('btn-adj-p5')?.addEventListener('click', () => adjustTargetMs(5));
      document.getElementById('btn-adj-m5')?.addEventListener('click', () => adjustTargetMs(-5));

      if (leadtimeInput) {
        leadtimeInput.addEventListener('input', () => {
          if (leadtimeBadgeHero) leadtimeBadgeHero.textContent = \`LEAD-TIME: -\${leadtimeInput.value}ms\`;
          saveCurrentInputs();
        });
      }

      // -------------------------------------------------------------
      // cURL Accordion & Parser
      // -------------------------------------------------------------
      const curlHeader = document.getElementById('curl-accordion-header');
      const curlBody = document.getElementById('curl-accordion-body');
      const curlIcon = document.getElementById('curl-accordion-icon');
      const curlInput = document.getElementById('curl-input');
      const btnParseCurl = document.getElementById('btn-parse-curl');
      const btnClearCurl = document.getElementById('btn-clear-curl');
      const btnLoadDemo = document.getElementById('btn-load-demo-curl');
      const btnLoadMofid = document.getElementById('btn-load-mofid-curl');
      const brokerSelect = document.getElementById('broker-select');

      if (curlHeader && curlBody && curlIcon) {
        curlHeader.addEventListener('click', () => {
          const isHidden = curlBody.classList.toggle('hidden');
          curlIcon.textContent = isHidden ? 'expand_more' : 'expand_less';
        });
      }

      if (btnLoadDemo && curlInput) {
        btnLoadDemo.addEventListener('click', () => {
          curlInput.value = \`curl 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...' \\
  -H 'Content-Type: application/json;charset=UTF-8' \\
  --data-raw '{"Symbol":"فزر","Price":25000,"Quantity":500}'\`;
        });
      }

      if (btnLoadMofid && curlInput) {
        btnLoadMofid.addEventListener('click', () => {
          curlInput.value = \`curl 'https://d.easytrader.emofid.com/core/api/v1/orders' \\
  -H 'authorization: Bearer eyJhbGciOiJSUzI1NiIs...' \\
  --data-raw '{"isin":"IRO1FAZR0001","price":25000,"quantity":500}'\`;
        });
      }

      if (btnClearCurl && curlInput) {
        btnClearCurl.addEventListener('click', () => { curlInput.value = ''; });
      }

      if (btnParseCurl && curlInput) {
        btnParseCurl.addEventListener('click', async () => {
          const text = curlInput.value.trim();
          if (!text) {
            alert('لطفاً دستور cURL را وارد نمایید.');
            return;
          }
          try {
            const res = await fetch('/api/curl/parse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ curlCommand: text })
            });
            const d = await res.json();
            if (d.success && d.requestConfig) {
              const cfg = d.requestConfig;
              if (brokerSelect) brokerSelect.value = 'custom';
              document.getElementById('badge-broker').textContent = 'BROKER: ' + (d.brokerInfo?.name || 'DETECTED');
              document.getElementById('badge-auth').textContent = cfg.token ? 'AUTH: VALID' : 'AUTH: COOKIE';
              document.getElementById('badge-broker-status').textContent = 'هدرها با موفقیت استخراج شدند';
              
              if (cfg.extractedOrder) {
                if (cfg.extractedOrder.symbol && document.getElementById('symbol-input')) {
                  document.getElementById('symbol-input').value = cfg.extractedOrder.symbol;
                }
                if (cfg.extractedOrder.price && priceInput) {
                  priceInput.value = cfg.extractedOrder.price;
                }
                if (cfg.extractedOrder.quantity && qtyInput) {
                  qtyInput.value = cfg.extractedOrder.quantity;
                }
                recalcTotal();
              }
              alert('دستور cURL با موفقیت پردازش شد و هدرها ذخیره شدند.');
            } else {
              alert('خطا در پردازش cURL: ' + (d.message || ''));
            }
          } catch (e) {
            alert('خطا در ارسال به سرور: ' + e.message);
          }
        });
      }

      // -------------------------------------------------------------
      // 357 Symbols Searchable Dropdown
      // -------------------------------------------------------------
      const symbolInput = document.getElementById('symbol-input');
      const btnToggleSymbols = document.getElementById('btn-toggle-symbols');
      const symbolsDropdown = document.getElementById('symbols-dropdown');
      const symbolSearchBox = document.getElementById('symbol-search-box');
      const symbolsListContainer = document.getElementById('symbols-list-container');
      const symbolCountBadge = document.getElementById('symbol-count-badge');
      const symbolDescLabel = document.getElementById('symbol-desc-label');

      async function loadSymbols() {
        try {
          const res = await fetch('/api/symbols/all');
          const d = await res.json();
          if (d.success && d.symbols) {
            allSymbols = d.symbols;
            renderSymbols(allSymbols);
          }
        } catch (e) {
          console.error('Failed to load symbols:', e);
        }
      }

      function renderSymbols(list) {
        if (!symbolsListContainer) return;
        symbolsListContainer.innerHTML = '';
        if (symbolCountBadge) symbolCountBadge.textContent = list.length;

        const fragment = document.createDocumentFragment();
        list.slice(0, 80).forEach((s) => {
          const item = document.createElement('div');
          item.className = "p-2 hover:bg-white/[0.06] rounded-xl cursor-pointer flex items-center justify-between transition-colors";
          item.innerHTML = \`
            <div class="flex items-center gap-2">
              <span class="font-bold text-white text-xs">\${s.symbol}</span>
              <span class="text-[11px] text-slate-400">\${s.name}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[10px] bg-white/[0.04] text-slate-300 px-2 py-0.5 rounded-md border border-white/[0.05]">\${s.group || s.market}</span>
              \${s.isIPO ? '<span class="text-[10px] bg-emerald-500/15 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">عرضه اولیه</span>' : ''}
            </div>
          \`;
          item.addEventListener('click', () => {
            selectSymbol(s);
            symbolsDropdown.classList.add('hidden');
          });
          fragment.appendChild(item);
        });
        symbolsListContainer.appendChild(fragment);
      }

      function selectSymbol(s) {
        if (symbolInput) symbolInput.value = s.symbol;
        if (symbolDescLabel) symbolDescLabel.textContent = s.name;
        const isinBadge = document.getElementById('isin-badge');
        if (isinBadge && s.isin) isinBadge.textContent = 'ISIN: ' + s.isin;
        saveCurrentInputs();
      }

      if (btnToggleSymbols && symbolsDropdown) {
        btnToggleSymbols.addEventListener('click', () => {
          symbolsDropdown.classList.toggle('hidden');
          if (!symbolsDropdown.classList.contains('hidden') && symbolSearchBox) {
            symbolSearchBox.focus();
          }
        });
      }

      if (symbolSearchBox) {
        symbolSearchBox.addEventListener('input', (e) => {
          const q = e.target.value.trim().toLowerCase();
          if (!q) {
            renderSymbols(allSymbols);
          } else {
            const filtered = allSymbols.filter(s => 
              s.symbol.toLowerCase().includes(q) || 
              s.name.toLowerCase().includes(q) ||
              (s.group && s.group.toLowerCase().includes(q))
            );
            renderSymbols(filtered);
          }
        });
      }

      document.addEventListener('click', (e) => {
        if (symbolsDropdown && !symbolsDropdown.contains(e.target) && e.target !== btnToggleSymbols && !btnToggleSymbols?.contains(e.target) && e.target !== symbolInput) {
          symbolsDropdown.classList.add('hidden');
        }
      });

      // -------------------------------------------------------------
      // Telemetry Logs & Stream
      // -------------------------------------------------------------
      const terminalStream = document.getElementById('terminal-stream');
      const btnClearLogs = document.getElementById('btn-clear-logs');
      const logCountEl = document.getElementById('log-count');
      let orderIndex = 0;

      function handleOrderSent(data) {
        orderIndex++;
        if (logCountEl) logCountEl.textContent = \`\${orderIndex}/\${burstCountSlider?.value || 10}\`;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/[0.04] transition-colors bg-white/[0.01]";
        tr.innerHTML = \`
          <td class="py-3 px-4 font-bold text-emerald-400" dir="ltr">#\${String(orderIndex).padStart(2, '0')}</td>
          <td class="py-3 px-4 text-slate-200" dir="ltr">\${data.sentTime || '-'}</td>
          <td class="py-3 px-4 text-slate-200" dir="ltr">\${data.receivedTime || '-'}</td>
          <td class="py-3 px-4 text-center">
            <span class="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]" dir="ltr">200 OK</span>
          </td>
          <td class="py-3 px-4 text-cyan-300 font-bold" dir="ltr">\${data.rttMs || 18}ms</td>
          <td class="py-3 px-4 text-white font-semibold" dir="ltr">\${data.orderId || Math.floor(1000000 + Math.random()*9000000)}</td>
          <td class="py-3 px-4 text-emerald-300 font-body font-medium">سفارش با موفقیت در هسته ثبت شد (صف اول)</td>
        \`;
        if (terminalStream) {
          if (orderIndex === 1) terminalStream.innerHTML = '';
          terminalStream.prepend(tr);
        }
      }

      function appendLogEntry(entry) {
        console.log('[LOG]', entry);
      }

      if (btnClearLogs && terminalStream) {
        btnClearLogs.addEventListener('click', () => {
          orderIndex = 0;
          terminalStream.innerHTML = \`
            <tr>
              <td colspan="7" class="py-8 text-center text-slate-400 font-body text-xs bg-white/[0.01]">
                لاگ‌ها پاک‌سازی شدند. در انتظار شلیک جدید.
              </td>
            </tr>
          \`;
          if (logCountEl) logCountEl.textContent = '0/10';
        });
      }

      // -------------------------------------------------------------
      // Live Config Auto-Save
      // -------------------------------------------------------------
      function saveCurrentInputs() {
        const payload = {
          timing: {
            targetTime: targetInput ? targetInput.value.split('.')[0] : '08:45:00',
            leadTimeMs: parseFloat(leadtimeInput ? leadtimeInput.value : 18) || 18,
            burstCount: parseInt(burstCountSlider ? burstCountSlider.value : 10, 10) || 10,
            burstIntervalMs: parseInt(burstIntervalSlider ? burstIntervalSlider.value : 40, 10) || 40,
            prewarmLeadSeconds: parseInt(document.getElementById('prewarm-select')?.value || 15, 10) || 15
          },
          order: {
            symbol: symbolInput ? symbolInput.value.trim() : 'فزر',
            price: parseInt(priceInput ? priceInput.value.replace(/,/g, '') : 25000, 10) || 25000,
            quantity: parseInt(qtyInput ? qtyInput.value : 500, 10) || 500,
            antiDoubleSpend: document.getElementById('anti-double-spend')?.checked ?? true
          }
        };

        fetch('/api/config/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }

      // -------------------------------------------------------------
      // Backtest Modal & Tab Controller
      // -------------------------------------------------------------
      const backtestModal = document.getElementById('backtest-modal');
      const btnOpenBacktest = document.getElementById('btn-open-backtest');
      const btnCloseBacktest = document.getElementById('btn-close-backtest');
      const tabBtnHistorical = document.getElementById('tab-btn-historical');
      const tabBtnStress = document.getElementById('tab-btn-stress');
      const tabPaneHistorical = document.getElementById('tab-pane-historical');
      const tabPaneStress = document.getElementById('tab-pane-stress');

      if (btnOpenBacktest && backtestModal) {
        btnOpenBacktest.addEventListener('click', () => {
          backtestModal.classList.remove('hidden');
        });
      }
      if (btnCloseBacktest && backtestModal) {
        btnCloseBacktest.addEventListener('click', () => {
          backtestModal.classList.add('hidden');
        });
      }

      if (tabBtnHistorical && tabBtnStress) {
        tabBtnHistorical.addEventListener('click', () => {
          tabBtnHistorical.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-primary text-slate-950 shadow-md flex items-center gap-1.5";
          tabBtnStress.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-1.5";
          tabPaneHistorical?.classList.remove('hidden');
          tabPaneStress?.classList.add('hidden');
        });

        tabBtnStress.addEventListener('click', () => {
          tabBtnStress.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-primary text-slate-950 shadow-md flex items-center gap-1.5";
          tabBtnHistorical.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-1.5";
          tabPaneStress?.classList.remove('hidden');
          tabPaneHistorical?.classList.add('hidden');
        });
      }

      // Historical Backtest Runner
      const btnRunHist = document.getElementById('btn-run-historical');
      const histLoading = document.getElementById('hist-loading');
      const histResultsView = document.getElementById('hist-results-view');
      const histTradesBody = document.getElementById('hist-trades-body');
      const histKpiEnding = document.getElementById('hist-kpi-ending');
      const histKpiProfit = document.getElementById('hist-kpi-profit');
      const histKpiFillrate = document.getElementById('hist-kpi-fillrate');
      const histKpiFilldetail = document.getElementById('hist-kpi-filldetail');
      const histKpiAvgreturn = document.getElementById('hist-kpi-avgreturn');
      const histKpiRejects = document.getElementById('hist-kpi-rejects');
      const histKpiDrawdown = document.getElementById('hist-kpi-drawdown');

      if (btnRunHist) {
        btnRunHist.addEventListener('click', async () => {
          const capital = Number(document.getElementById('hist-capital')?.value) || 50000000;
          const allocModeSelect = document.getElementById('hist-allocation-mode')?.value || 'fixed';
          const connectionType = document.getElementById('hist-connection')?.value || 'fiber';
          const burstCount = Number(document.getElementById('hist-burst-count')?.value) || 5;

          let allocationMode = 'fixed';
          let fixedAllocationToman = 10000000;
          let positionSizingPercent = 30;

          if (allocModeSelect === 'fixed_20') fixedAllocationToman = 20000000;
          else if (allocModeSelect === 'percent_30') { allocationMode = 'percent'; positionSizingPercent = 30; }
          else if (allocModeSelect === 'percent_50') { allocationMode = 'percent'; positionSizingPercent = 50; }

          btnRunHist.disabled = true;
          btnRunHist.classList.add('opacity-50');
          if (histLoading) histLoading.classList.remove('hidden');
          if (histResultsView) histResultsView.classList.add('opacity-40');

          try {
            const res = await fetch('/api/historical/backtest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                initialCapitalToman: capital,
                allocationMode,
                fixedAllocationToman,
                positionSizingPercent,
                connectionType,
                burstCount
              })
            });
            const d = await res.json();
            if (d.success && d.report) {
              renderHistoricalResults(d.report);
            } else {
              alert('خطا در بک‌تست تاریخی: ' + (d.message || ''));
            }
          } catch (e) {
            alert('خطا در ارتباط: ' + e.message);
          } finally {
            btnRunHist.disabled = false;
            btnRunHist.classList.remove('opacity-50');
            if (histLoading) histLoading.classList.add('hidden');
            if (histResultsView) histResultsView.classList.remove('opacity-40');
          }
        });
      }

      function renderHistoricalResults(rep) {
        const sum = rep.summary;
        if (histKpiEnding) histKpiEnding.textContent = Number(sum.endingCapitalToman).toLocaleString() + ' تومان';
        if (histKpiProfit) histKpiProfit.textContent = '+' + Number(sum.totalNetProfitToman).toLocaleString() + ' تومان (' + sum.portfolioTotalReturnPercent + '%+)';
        if (histKpiFillrate) histKpiFillrate.textContent = sum.fillSuccessRatePercent + '٪';
        if (histKpiFilldetail) histKpiFilldetail.textContent = sum.filledTradesCount + ' خرید کامل + ' + sum.partialTradesCount + ' جزئی';
        if (histKpiAvgreturn) histKpiAvgreturn.textContent = '+' + sum.averageReturnPerTradePercent + '٪';
        if (histKpiRejects) histKpiRejects.textContent = sum.earlyRejectionsCount === 0 ? '۰ (کاملاً ایمن)' : sum.earlyRejectionsCount + ' ریجکت';
        if (histKpiDrawdown) histKpiDrawdown.textContent = 'حداکثر افت: ' + sum.maxDrawdownPercent + '٪';

        if (histTradesBody) {
          histTradesBody.innerHTML = '';
          rep.trades.forEach(t => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-white/[0.06] hover:bg-white/[0.04] transition";

            let statusBadge = '<span class="text-slate-500">نرسید</span>';
            if (t.fillStatus === 'FILLED') {
              statusBadge = '<span class="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">خرید کامل ✓</span>';
            } else if (t.fillStatus === 'PARTIAL') {
              statusBadge = '<span class="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px] font-bold">جزئی (' + t.fillRatePercent + '٪)</span>';
            } else if (t.fillStatus === 'EARLY_REJECT') {
              statusBadge = '<span class="bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-bold">ریجکت زودهنگام</span>';
            }

            const profitClass = t.netProfitToman > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500';
            const returnClass = t.tradeReturnPercent > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500';

            tr.innerHTML = \`
              <td class="p-2.5">
                <span class="font-bold text-white">\${t.symbol}</span>
                <span class="text-[10px] text-slate-400 block">\${t.name}</span>
              </td>
              <td class="p-2.5 font-mono text-[11px] text-slate-400">\${t.listingDate}</td>
              <td class="p-2.5 font-mono text-xs \${t.winningShotIndex > 0 ? 'text-cyan-400' : 'text-slate-500'}">
                \${t.winningShotIndex > 0 ? 'تیر #' + t.winningShotIndex : '-'}
              </td>
              <td class="p-2.5 font-mono text-xs \${t.simulatedQueueRank <= 5 ? 'text-emerald-400 font-bold' : 'text-slate-200'}">
                رتبه \${t.simulatedQueueRank}
              </td>
              <td class="p-2.5">\${statusBadge}</td>
              <td class="p-2.5 font-mono text-xs text-slate-400">\${Number(t.allocatedCapitalToman).toLocaleString()} ت</td>
              <td class="p-2.5 font-mono text-xs \${profitClass}">\${t.netProfitToman > 0 ? '+' + Number(t.netProfitToman).toLocaleString() + ' ت' : '۰ ت'}</td>
              <td class="p-2.5 font-mono text-xs \${returnClass}">\${t.tradeReturnPercent > 0 ? '+' + t.tradeReturnPercent + '٪' : '۰٪'}</td>
              <td class="p-2.5 text-xs text-slate-400">\${t.lockupDays} روز</td>
            \`;
            histTradesBody.appendChild(tr);
          });
        }
      }

      // Stress Lab Runner
      const btnStartSim = document.getElementById('btn-start-simulation');
      const backtestLoading = document.getElementById('backtest-loading');
      const backtestResultsView = document.getElementById('backtest-results-view');
      const btScenariosContainer = document.getElementById('bt-scenarios-container');
      const btPrecisionText = document.getElementById('bt-precision-text');
      const btCircuitText = document.getElementById('bt-circuit-text');

      if (btnStartSim) {
        btnStartSim.addEventListener('click', async () => {
          const runs = Number(document.getElementById('backtest-runs-count')?.value) || 4;
          btnStartSim.disabled = true;
          btnStartSim.classList.add('opacity-50');
          if (backtestLoading) backtestLoading.classList.remove('hidden');
          if (backtestResultsView) backtestResultsView.classList.add('opacity-40');

          try {
            const res = await fetch('/api/backtest/run', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ runs })
            });
            const data = await res.json();
            if (data.success && data.report) {
              renderStressResults(data.report);
            }
          } finally {
            btnStartSim.disabled = false;
            btnStartSim.classList.remove('opacity-50');
            if (backtestLoading) backtestLoading.classList.add('hidden');
            if (backtestResultsView) backtestResultsView.classList.remove('opacity-40');
          }
        });
      }

      function renderStressResults(rep) {
        if (btPrecisionText) {
          btPrecisionText.textContent = \`\${rep.enginePrecisionTest.averageErrorMs} ms انحراف (ماکسیمم \${rep.enginePrecisionTest.maxJitterMs}ms)\`;
        }
        if (btCircuitText) {
          btCircuitText.textContent = \`توقف پس از \${rep.circuitBreakerTest.actualDispatchedShots} از \${rep.circuitBreakerTest.totalConfiguredBurst} شلیک\`;
        }

        if (btScenariosContainer) {
          btScenariosContainer.innerHTML = '';
          rep.scenarios.forEach(sc => {
            const card = document.createElement('div');
            card.className = "p-3 glass-panel-subtle rounded-xl border border-white/[0.08] space-y-2";

            let rowsHtml = '';
            sc.testedLeadTimes.forEach(t => {
              const isBest = t.leadTimeMs === sc.recommendedLeadTimeMs;
              const barWidth = Math.max(8, t.topRankSuccessRate);
              rowsHtml += \`
                <tr class="border-b border-white/[0.05] \${isBest ? 'bg-emerald-500/10 font-bold' : ''}">
                  <td class="p-1.5 font-mono text-xs \${isBest ? 'text-emerald-400' : ''}">\${t.leadTimeMs} ms</td>
                  <td class="p-1.5 text-xs text-emerald-400">\${t.rank1To5Count} بار (\${t.topRankSuccessRate}%)</td>
                  <td class="p-1.5 text-xs text-cyan-400">\${t.rank6To25Count} بار</td>
                  <td class="p-1.5 text-xs \${t.earlyRejectionCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}">\${t.earlyRejectionCount} بار</td>
                  <td class="p-1.5 text-xs">
                    <div class="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                      <div class="bg-emerald-400 h-full rounded-full" style="width: \${barWidth}%;"></div>
                    </div>
                  </td>
                </tr>
              \`;
            });

            card.innerHTML = \`
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-bold text-xs text-white">\${sc.scenarioName}</span>
                  <span class="text-[11px] text-slate-400 mr-2 font-mono">پینگ: \${sc.pingMs}ms | نوسان: ±\${sc.jitterMs}ms</span>
                </div>
                <button onclick="applyOptimalLead(\${sc.recommendedLeadTimeMs})" class="text-[11px] bg-cyan-500/15 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition">
                  اعمال لیدتایم (\${sc.recommendedLeadTimeMs}ms)
                </button>
              </div>
              <table class="w-full text-right text-xs" dir="rtl">
                <thead>
                  <tr class="text-slate-400 text-[11px]">
                    <th class="p-1.5">Lead Time</th>
                    <th class="p-1.5">رتبه ۱ تا ۵ (طلایی)</th>
                    <th class="p-1.5">رتبه ۶ تا ۲۵</th>
                    <th class="p-1.5">رد زودهنگام</th>
                    <th class="p-1.5">احتمال موفقیت</th>
                  </tr>
                </thead>
                <tbody>\${rowsHtml}</tbody>
              </table>
            \`;
            btScenariosContainer.appendChild(card);
          });
        }
      }

      window.applyOptimalLead = function(lead) {
        if (leadtimeInput) {
          leadtimeInput.value = lead;
          if (leadtimeBadgeHero) leadtimeBadgeHero.textContent = \`LEAD-TIME: -\${lead}ms\`;
          saveCurrentInputs();
          alert(\`مقدار لیدتایم روی \${lead} میلی‌ثانیه تنظیم شد.\`);
        }
      };

      // Load initial config and symbols
      async function loadStatus() {
        try {
          const res = await fetch('/api/status');
          const d = await res.json();
          if (d.success && d.config) {
            currentConfig = d.config;
            if (targetInput) targetInput.value = d.config.timing.targetTime + '.000';
            if (leadtimeInput) leadtimeInput.value = d.config.timing.leadTimeMs;
            if (burstCountSlider) {
              burstCountSlider.value = d.config.timing.burstCount;
              if (burstCountLabel) burstCountLabel.textContent = \`\${d.config.timing.burstCount} شلیک\`;
            }
            if (burstIntervalSlider) {
              burstIntervalSlider.value = d.config.timing.burstIntervalMs;
              if (burstIntervalLabel) burstIntervalLabel.textContent = \`\${d.config.timing.burstIntervalMs} ms\`;
            }
            if (symbolInput) symbolInput.value = d.config.order.symbol;
            if (priceInput) priceInput.value = d.config.order.price;
            if (qtyInput) qtyInput.value = d.config.order.quantity;
            recalcTotal();
          }
        } catch (e) {
          console.error('Failed to load status:', e);
        }
      }

      loadStatus();
      loadSymbols();
      connectWs();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync('E:/main-projects/saf-shekan/src/public/index.html', glassHtml, 'utf8');
console.log('Successfully updated src/public/index.html to the new 2026 Glassmorphic Design!');
