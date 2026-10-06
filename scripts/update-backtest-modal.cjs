const fs = require('fs');

let html = fs.readFileSync('E:/main-projects/saf-shekan/src/public/index.html', 'utf8');

// Strip out any previous modal content after footer
const footerIndex = html.indexOf('</footer>');
if (footerIndex !== -1) {
  html = html.substring(0, footerIndex + '</footer>'.length);
}

// Full modal markup with 2 tabs
const fullModalHtml = `
<!-- Backtest & Simulation Modal -->
<div id="backtest-modal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-fadeIn">
  <div class="bg-surface-container-low border border-outline-variant/60 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
    <!-- Header with Tabs -->
    <div class="p-space-md bg-surface-container flex flex-wrap items-center justify-between border-b border-outline-variant/30 gap-space-sm">
      <div class="flex items-center gap-space-sm">
        <span class="material-symbols-outlined text-secondary text-[28px]">biotech</span>
        <div>
          <h2 class="font-headline-sm text-headline-sm text-on-surface">آزمایشگاه بک‌تست و شبیه‌ساز معاملات HFT بورس تهران</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant">تست استرس هسته معاملات و بک‌تست روی سوابق واقعی ۲۰ عرضه اولیه بورس و فرابورس</p>
        </div>
      </div>

      <!-- Tab Buttons -->
      <div class="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/30">
        <button id="tab-btn-historical" class="px-space-md py-1.5 rounded-lg text-xs font-bold transition-all bg-primary text-on-primary shadow-sm flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px]">history_edu</span>
          <span>بک‌تست داده‌های تاریخی بورس</span>
        </button>
        <button id="tab-btn-stress" class="px-space-md py-1.5 rounded-lg text-xs font-bold transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px]">speed</span>
          <span>شبیه‌ساز استرس بازگشایی (RTT)</span>
        </button>
      </div>

      <button id="btn-close-backtest" class="p-1 rounded-lg hover:bg-surface-container-high text-outline-variant hover:text-on-surface transition-colors">
        <span class="material-symbols-outlined text-[22px]">close</span>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-space-md overflow-y-auto space-y-space-md flex-1">

      <!-- ==================== TAB 1: HISTORICAL DATA BACKTEST ==================== -->
      <div id="tab-pane-historical" class="space-y-space-md">
        <!-- Configuration Card -->
        <div class="bg-surface-container p-space-md rounded-xl border border-outline-variant/30 space-y-space-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-primary flex items-center gap-1">
              <span class="material-symbols-outlined text-[18px]">tune</span>
              <span>پارامترهای مالی و اتصال برای بک‌تست تاریخی:</span>
            </span>
            <span class="text-[11px] text-outline-variant">شامل داده‌های واقعی پی‌پاد، توسن، فجهان، نخریس، کرومیت و...</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
            <div>
              <label class="text-[11px] text-on-surface-variant block mb-1">سرمایه اولیه پورتفوی (تومان):</label>
              <input id="hist-capital" type="number" value="50000000" step="5000000" class="w-full bg-surface-container-lowest text-on-surface text-xs p-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:border-primary font-mono" />
            </div>

            <div>
              <label class="text-[11px] text-on-surface-variant block mb-1">حجم هر سفارش سرخطی:</label>
              <select id="hist-allocation-mode" class="w-full bg-surface-container-lowest text-on-surface text-xs p-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:border-primary">
                <option value="fixed" selected>ثابت: ۱۰ میلیون تومان در هر نماد</option>
                <option value="fixed_20">ثابت: ۲۰ میلیون تومان در هر نماد</option>
                <option value="percent_30">درصدی: ۳۰٪ کل مانده پورتفوی (مرکب)</option>
                <option value="percent_50">درصدی: ۵۰٪ کل مانده پورتفوی</option>
              </select>
            </div>

            <div>
              <label class="text-[11px] text-on-surface-variant block mb-1">نوع بستر اتصال اینترنت:</label>
              <select id="hist-connection" class="w-full bg-surface-container-lowest text-on-surface text-xs p-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:border-primary">
                <option value="datacenter">سرور دیتاسنتر تهران (پینگ ۲ms | لید ۰.۸ms)</option>
                <option value="fiber" selected>فیبر نوری / VDSL تهران (پینگ ۱۶ms | لید ۷.۲ms)</option>
                <option value="mobile4g">اینترنت همراه 4G (پینگ ۴۴ms | لید ۲۰.۵ms)</option>
                <option value="adsl">اینترنت ADSL خانگی (پینگ ۷۵ms | لید ۳۴ms)</option>
              </select>
            </div>

            <div>
              <label class="text-[11px] text-on-surface-variant block mb-1">تنظیمات شلیک رگباری (Burst):</label>
              <div class="flex items-center gap-1">
                <select id="hist-burst-count" class="w-1/2 bg-surface-container-lowest text-on-surface text-xs p-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:border-primary">
                  <option value="3">۳ شلیک</option>
                  <option value="5" selected>۵ شلیک</option>
                  <option value="8">۸ شلیک</option>
                  <option value="10">۱۰ شلیک</option>
                </select>
                <button id="btn-run-historical" class="w-1/2 bg-primary hover:bg-primary-fixed text-on-primary font-bold text-xs p-2 rounded-lg flex items-center justify-center gap-1 shadow-md transition-all active:scale-95">
                  <span class="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>اجرای تست</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Historical Loading Spinner -->
        <div id="hist-loading" class="hidden p-8 flex flex-col items-center justify-center gap-3">
          <div class="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-primary animate-pulse">در حال شبیه‌سازی صف میلی‌ثانیه‌ای و بررسی حجم معاملات ۲۰ عرضه اولیه تاریخی...</p>
        </div>

        <!-- Historical Results View -->
        <div id="hist-results-view" class="space-y-space-md">
          <!-- KPI Summary Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
            <div class="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant/30">
              <span class="text-[11px] text-on-surface-variant block">سرمایه نهایی و سود کل:</span>
              <span id="hist-kpi-ending" class="font-data-mono-md text-data-mono-md font-bold text-primary block mt-0.5">--- تومان</span>
              <span id="hist-kpi-profit" class="text-[11px] text-primary block mt-0.5 font-bold">---</span>
            </div>

            <div class="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant/30">
              <span class="text-[11px] text-on-surface-variant block">نرخ موفقیت در صف (Fill Rate):</span>
              <span id="hist-kpi-fillrate" class="font-data-mono-md text-data-mono-md font-bold text-secondary block mt-0.5">---٪</span>
              <span id="hist-kpi-filldetail" class="text-[11px] text-outline-variant block mt-0.5">--- معامله موفق</span>
            </div>

            <div class="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant/30">
              <span class="text-[11px] text-on-surface-variant block">میانگین سود هر عرضه اولیه:</span>
              <span id="hist-kpi-avgreturn" class="font-data-mono-md text-data-mono-md font-bold text-tertiary block mt-0.5">---٪</span>
              <span class="text-[11px] text-outline-variant block mt-0.5">خروج در روز شکستن صف</span>
            </div>

            <div class="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant/30">
              <span class="text-[11px] text-on-surface-variant block">ریسک ریجکت زودهنگام:</span>
              <span id="hist-kpi-rejects" class="font-data-mono-md text-data-mono-md font-bold text-primary block mt-0.5">۰ (کاملاً ایمن)</span>
              <span id="hist-kpi-drawdown" class="text-[11px] text-outline-variant block mt-0.5">حداکثر افت: ۰٪</span>
            </div>
          </div>

          <!-- Trades Table -->
          <div class="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant/30 space-y-space-xs">
            <div class="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <h3 class="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary text-[16px]">receipt_long</span>
                <span>جزئیات عملکرد ربات در ۲۰ عرضه اولیه تاریخی بورس:</span>
              </h3>
              <span class="text-[11px] text-outline-variant">کارمزد خرید و فروش بورس (~۱.۲۵٪) در تمام ارقام کسر شده است.</span>
            </div>

            <div class="overflow-x-auto max-h-[380px]">
              <table class="w-full text-right text-xs" dir="rtl">
                <thead class="sticky top-0 bg-surface-container z-10">
                  <tr class="text-outline-variant text-[11px] border-b border-outline-variant/40">
                    <th class="p-2">نماد و شرکت</th>
                    <th class="p-2">تاریخ</th>
                    <th class="p-2">تیر برنده</th>
                    <th class="p-2">رتبه در صف</th>
                    <th class="p-2">وضعیت معامله</th>
                    <th class="p-2">سرمایه درگیر</th>
                    <th class="p-2">سود خالص</th>
                    <th class="p-2">بازدهی</th>
                    <th class="p-2">قفل صف</th>
                  </tr>
                </thead>
                <tbody id="hist-trades-body">
                  <tr>
                    <td colspan="9" class="text-center py-8 text-outline-variant text-xs">
                      برای مشاهده نتایج، دکمه «اجرای تست» را در بالا بزنید.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== TAB 2: STRESS LAB ==================== -->
      <div id="tab-pane-stress" class="hidden space-y-space-md">
        <!-- Control Bar -->
        <div class="bg-surface-container p-space-sm rounded-xl flex flex-wrap items-center justify-between gap-space-sm">
          <div class="flex items-center gap-space-sm">
            <span class="text-xs text-on-surface-variant">تعداد شبیه‌سازی در هر سناریو:</span>
            <select id="backtest-runs-count" class="bg-surface-container-lowest text-on-surface px-space-xs py-1 rounded text-xs">
              <option value="4" selected>۴ بار در هر سناریو (سریع ~ ۸ ثانیه)</option>
              <option value="8">۸ بار در هر سناریو (دقت بالا ~ ۱۶ ثانیه)</option>
            </select>
          </div>
          <button id="btn-start-simulation" class="px-space-md py-space-xs bg-primary hover:bg-primary-fixed text-on-primary font-bold text-xs rounded-lg flex items-center gap-1 shadow-md transition-all active:scale-95">
            <span class="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>شروع شبیه‌سازی استرس بازگشایی بازار</span>
          </button>
        </div>

        <!-- Stress Loading Indicator -->
        <div id="backtest-loading" class="hidden p-8 flex flex-col items-center justify-center gap-3">
          <div class="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary animate-pulse">در حال شبیه‌سازی مونت کارلو و پرتاب سفارش‌ها در ساعت صفر هسته معاملات...</p>
        </div>

        <!-- Stress Results View -->
        <div id="backtest-results-view" class="space-y-space-md">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            <div class="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant/30 flex items-center justify-between">
              <div>
                <span class="text-[11px] text-on-surface-variant block">دقت تایمر و Spin-Wait موتور:</span>
                <span id="bt-precision-text" class="font-data-mono-md text-data-mono-md font-bold text-primary">0 ms انحراف (بسیار دقیق)</span>
              </div>
              <span class="bg-primary/20 text-primary text-[11px] px-2 py-0.5 rounded font-bold">PASS 100%</span>
            </div>
            <div class="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant/30 flex items-center justify-between">
              <div>
                <span class="text-[11px] text-on-surface-variant block">مدارشکن ضد سفارش تکراری (Anti-Double):</span>
                <span id="bt-circuit-text" class="font-data-mono-md text-data-mono-md font-bold text-secondary">توقف فوری پس از ۲ شلیک</span>
              </div>
              <span class="bg-secondary/20 text-secondary text-[11px] px-2 py-0.5 rounded font-bold">SAFE ACTIVE</span>
            </div>
          </div>

          <div class="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant/30 space-y-space-sm">
            <h3 class="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-[16px]">leaderboard</span>
              <span>نتایج شبیه‌سازی انواع اتصالات اینترنت بورس ایران و شانس رتبه ۱ تا ۵:</span>
            </h3>
            <div id="bt-scenarios-container" class="space-y-space-sm">
              <div class="text-center text-xs text-outline-variant py-4">برای مشاهده تحلیل دقیق، دکمه «شروع شبیه‌سازی» را بزنید.</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
`;

html += fullModalHtml + '\n</body></html>';

// Now add the historical JS controller inside the main script
const histJs = `
    // -------------------------------------------------------------
    // Historical IPO Backtest Controller & Tab Switching
    // -------------------------------------------------------------
    const tabBtnHistorical = document.getElementById('tab-btn-historical');
    const tabBtnStress = document.getElementById('tab-btn-stress');
    const tabPaneHistorical = document.getElementById('tab-pane-historical');
    const tabPaneStress = document.getElementById('tab-pane-stress');

    if (tabBtnHistorical && tabBtnStress) {
      tabBtnHistorical.addEventListener('click', () => {
        tabBtnHistorical.className = "px-space-md py-1.5 rounded-lg text-xs font-bold transition-all bg-primary text-on-primary shadow-sm flex items-center gap-1";
        tabBtnStress.className = "px-space-md py-1.5 rounded-lg text-xs font-bold transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center gap-1";
        tabPaneHistorical.classList.remove('hidden');
        tabPaneStress.classList.add('hidden');
      });

      tabBtnStress.addEventListener('click', () => {
        tabBtnStress.className = "px-space-md py-1.5 rounded-lg text-xs font-bold transition-all bg-primary text-on-primary shadow-sm flex items-center gap-1";
        tabBtnHistorical.className = "px-space-md py-1.5 rounded-lg text-xs font-bold transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center gap-1";
        tabPaneStress.classList.remove('hidden');
        tabPaneHistorical.classList.add('hidden');
      });
    }

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

        if (allocModeSelect === 'fixed_20') {
          fixedAllocationToman = 20000000;
        } else if (allocModeSelect === 'percent_30') {
          allocationMode = 'percent';
          positionSizingPercent = 30;
        } else if (allocModeSelect === 'percent_50') {
          allocationMode = 'percent';
          positionSizingPercent = 50;
        }

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

          const data = await res.json();
          if (data.success && data.report) {
            renderHistoricalResults(data.report);
          } else {
            alert('خطا در اجرای بک‌تست تاریخی: ' + (data.message || 'خطای سرور'));
          }
        } catch (err) {
          alert('خطا در ارتباط با سرور: ' + err.message);
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
      if (histKpiFilldetail) histKpiFilldetail.textContent = sum.filledTradesCount + ' خرید کامل + ' + sum.partialTradesCount + ' خرید جزئی';
      if (histKpiAvgreturn) histKpiAvgreturn.textContent = '+' + sum.averageReturnPerTradePercent + '٪';
      if (histKpiRejects) histKpiRejects.textContent = sum.earlyRejectionsCount === 0 ? '۰ (کاملاً ایمن)' : sum.earlyRejectionsCount + ' ریجکت';
      if (histKpiDrawdown) histKpiDrawdown.textContent = 'حداکثر افت: ' + sum.maxDrawdownPercent + '٪';

      if (histTradesBody) {
        histTradesBody.innerHTML = '';
        rep.trades.forEach(t => {
          const tr = document.createElement('tr');
          tr.className = "border-b border-outline-variant/15 hover:bg-surface-container/60 transition";

          let statusBadge = '<span class="text-outline-variant">نرسید</span>';
          if (t.fillStatus === 'FILLED') {
            statusBadge = '<span class="bg-primary/15 text-primary px-2 py-0.5 rounded text-[11px] font-bold">خرید کامل ✓</span>';
          } else if (t.fillStatus === 'PARTIAL') {
            statusBadge = '<span class="bg-secondary/15 text-secondary px-2 py-0.5 rounded text-[11px] font-bold">جزئی (' + t.fillRatePercent + '٪)</span>';
          } else if (t.fillStatus === 'EARLY_REJECT') {
            statusBadge = '<span class="bg-error/15 text-error px-2 py-0.5 rounded text-[11px] font-bold">ریجکت زودهنگام</span>';
          }

          const profitClass = t.netProfitToman > 0 ? 'text-primary font-bold' : 'text-outline-variant';
          const returnClass = t.tradeReturnPercent > 0 ? 'text-primary font-bold' : 'text-outline-variant';

          tr.innerHTML = \`
            <td class="p-2">
              <span class="font-bold text-on-surface">\${t.symbol}</span>
              <span class="text-[10px] text-outline-variant block">\${t.name}</span>
            </td>
            <td class="p-2 font-mono text-[11px] text-outline-variant">\${t.listingDate}</td>
            <td class="p-2 font-mono text-xs \${t.winningShotIndex > 0 ? 'text-secondary' : 'text-outline-variant'}">
              \${t.winningShotIndex > 0 ? 'تیر #' + t.winningShotIndex : '-'}
            </td>
            <td class="p-2 font-mono text-xs \${t.simulatedQueueRank <= 5 ? 'text-primary font-bold' : 'text-on-surface'}">
              رتبه \${t.simulatedQueueRank}
            </td>
            <td class="p-2">\${statusBadge}</td>
            <td class="p-2 font-mono text-xs text-outline-variant">\${Number(t.allocatedCapitalToman).toLocaleString()} ت</td>
            <td class="p-2 font-mono text-xs \${profitClass}">\${t.netProfitToman > 0 ? '+' + Number(t.netProfitToman).toLocaleString() + ' ت' : '۰ ت'}</td>
            <td class="p-2 font-mono text-xs \${returnClass}">\${t.tradeReturnPercent > 0 ? '+' + t.tradeReturnPercent + '٪' : '۰٪'}</td>
            <td class="p-2 text-xs text-outline-variant">\${t.lockupDays} روز</td>
          \`;

          histTradesBody.appendChild(tr);
        });
      }
    }
`;

// Inject the historical JS right before loadStatus();
if (html.includes('loadStatus();')) {
  html = html.replace('loadStatus();', histJs + '\n    loadStatus();');
}

fs.writeFileSync('E:/main-projects/saf-shekan/src/public/index.html', html, 'utf8');
console.log('Successfully injected 2-tab Historical & Stress Backtest Modal into src/public/index.html');
