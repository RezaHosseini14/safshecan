const fs = require('fs');

let html = fs.readFileSync('E:/main-projects/saf-shekan/src/public/index.html', 'utf8');

// 1. Add "بک‌تست و شبیه‌ساز" button to Card 3
const oldButtonsGrid = `<div class="grid grid-cols-3 gap-space-xs">
<button class="py-space-xs bg-error-container/20 border border-error/40 text-error hover:bg-error hover:text-on-error transition-all font-body-sm text-body-sm rounded flex items-center justify-center gap-space-xs" id="btn-disarm" type="button">
<span class="material-symbols-outlined text-[14px]">cancel</span>
<span>لغو آماده‌باش</span>
</button>
<button class="py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface transition-all font-body-sm text-body-sm rounded flex items-center justify-center gap-space-xs" id="btn-dry-run" type="button">
<span class="material-symbols-outlined text-[14px]">science</span>
<span>شلیک آزمایشی</span>
</button>
<button class="py-space-xs bg-surface-container hover:bg-surface-container-high text-secondary transition-all font-body-sm text-body-sm rounded flex items-center justify-center gap-space-xs" id="btn-reping" type="button">
<span class="material-symbols-outlined text-[14px]">speed</span>
<span>تست RTT</span>
</button>
</div>`;

const newButtonsGrid = `<div class="grid grid-cols-2 md:grid-cols-4 gap-space-xs">
<button class="py-space-xs bg-error-container/20 border border-error/40 text-error hover:bg-error hover:text-on-error transition-all font-body-sm text-body-sm rounded flex items-center justify-center gap-space-xs" id="btn-disarm" type="button">
<span class="material-symbols-outlined text-[14px]">cancel</span>
<span>لغو آماده‌باش</span>
</button>
<button class="py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface transition-all font-body-sm text-body-sm rounded flex items-center justify-center gap-space-xs" id="btn-dry-run" type="button">
<span class="material-symbols-outlined text-[14px]">science</span>
<span>شلیک آزمایشی</span>
</button>
<button class="py-space-xs bg-surface-container hover:bg-surface-container-high text-secondary transition-all font-body-sm text-body-sm rounded flex items-center justify-center gap-space-xs" id="btn-reping" type="button">
<span class="material-symbols-outlined text-[14px]">speed</span>
<span>تست RTT</span>
</button>
<button class="py-space-xs bg-secondary/15 border border-secondary/40 text-secondary hover:bg-secondary hover:text-on-secondary transition-all font-body-sm text-body-sm rounded flex items-center justify-center gap-space-xs" id="btn-open-backtest" type="button">
<span class="material-symbols-outlined text-[14px]">biotech</span>
<span class="font-bold">بک‌تست و شبیه‌ساز</span>
</button>
</div>`;

if (html.includes(oldButtonsGrid)) {
  html = html.replace(oldButtonsGrid, newButtonsGrid);
} else {
  console.log('Button grid replacement pattern not matched directly, trying normalized match');
  html = html.replace(/<div class="grid grid-cols-3 gap-space-xs">[\s\S]*?id="btn-reping"[\s\S]*?<\/div>/, newButtonsGrid);
}

// 2. Add Modal HTML before </body>
const modalHtml = `
<!-- Backtest & Simulation Modal -->
<div id="backtest-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
  <div class="bg-surface-container-low border border-outline-variant/60 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
    <!-- Header -->
    <div class="p-space-md bg-surface-container flex items-center justify-between border-b border-outline-variant/30">
      <div class="flex items-center gap-space-sm">
        <span class="material-symbols-outlined text-secondary text-[24px]">biotech</span>
        <div>
          <h2 class="font-headline-sm text-headline-sm text-on-surface">آزمایشگاه بک‌تست و شبیه‌ساز استرس بورس (HFT Simulation Lab)</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant">شبیه‌سازی کامل بازگشایی بازار، محاسبه دقت میلی‌ثانیه‌ای و تعیین بهترین لیدتایم برای کسب رتبه ۱ تا ۵</p>
        </div>
      </div>
      <button id="btn-close-backtest" class="p-1 rounded-lg hover:bg-surface-container-high text-outline-variant hover:text-on-surface transition-colors">
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>

    <!-- Body -->
    <div class="p-space-md overflow-y-auto space-y-space-md flex-1">
      <!-- Quick Control Bar -->
      <div class="bg-surface-container p-space-sm rounded-xl flex flex-wrap items-center justify-between gap-space-sm">
        <div class="flex items-center gap-space-sm">
          <span class="text-xs text-on-surface-variant">تعداد شبیه‌سازی در هر سناریو:</span>
          <select id="backtest-runs-count" class="bg-surface-container-lowest text-on-surface px-space-xs py-1 rounded text-xs">
            <option value="4" selected>۴ بار در هر سناریو (سریع ~ ۸ ثانیه)</option>
            <option value="8">۸ بار در هر سناریو (دقت بالا ~ ۱۶ ثانیه)</option>
            <option value="12">۱۲ بار در هر سناریو (جامع ~ ۲۵ ثانیه)</option>
          </select>
        </div>
        <button id="btn-start-simulation" class="px-space-md py-space-xs bg-primary hover:bg-primary-fixed text-on-primary font-bold text-xs rounded-lg flex items-center gap-1 shadow-md transition-all active:scale-95">
          <span class="material-symbols-outlined text-[16px]">play_arrow</span>
          <span>شروع شبیه‌سازی استرس بازگشایی بازار</span>
        </button>
      </div>

      <!-- Loading Indicator -->
      <div id="backtest-loading" class="hidden p-8 flex flex-col items-center justify-center gap-3">
        <div class="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
        <p class="text-xs font-bold text-secondary animate-pulse">در حال اجرای شبیه‌سازی مونت کارلو و پرتاب صدها سفارش در ساعت صفر هسته معاملات...</p>
      </div>

      <!-- Results Container -->
      <div id="backtest-results-view" class="space-y-space-md">
        <!-- Banner Cards: Precision & Circuit Breaker -->
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

        <!-- Scenarios Table -->
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
`;

html = html.replace('</body>', modalHtml + '\n</body>');

// 3. Add Modal JS Logic
const modalJs = `
    // -------------------------------------------------------------
    // Backtest Modal Controller
    // -------------------------------------------------------------
    const btnOpenBacktest = document.getElementById('btn-open-backtest');
    const btnCloseBacktest = document.getElementById('btn-close-backtest');
    const backtestModal = document.getElementById('backtest-modal');
    const btnStartSim = document.getElementById('btn-start-simulation');
    const backtestLoading = document.getElementById('backtest-loading');
    const backtestResultsView = document.getElementById('backtest-results-view');
    const btScenariosContainer = document.getElementById('bt-scenarios-container');
    const btPrecisionText = document.getElementById('bt-precision-text');
    const btCircuitText = document.getElementById('bt-circuit-text');

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
            renderBacktestResults(data.report);
          } else {
            alert('خطا در اجرای بک‌تست: ' + (data.message || 'نامشخص'));
          }
        } catch (err) {
          alert('خطا در ارتباط با سرور بک‌تست: ' + err.message);
        } finally {
          btnStartSim.disabled = false;
          btnStartSim.classList.remove('opacity-50');
          if (backtestLoading) backtestLoading.classList.add('hidden');
          if (backtestResultsView) backtestResultsView.classList.remove('opacity-40');
        }
      });
    }

    function renderBacktestResults(rep) {
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
          card.className = "p-3 bg-surface-container rounded-lg border border-outline-variant/30 space-y-2";

          let rowsHtml = '';
          sc.testedLeadTimes.forEach(t => {
            const isBest = t.leadTimeMs === sc.recommendedLeadTimeMs;
            const barWidth = Math.max(8, t.topRankSuccessRate);
            rowsHtml += \`
              <tr class="border-b border-outline-variant/20 \${isBest ? 'bg-primary/10 font-bold' : ''}">
                <td class="p-1 font-mono text-xs \${isBest ? 'text-primary' : ''}">\${t.leadTimeMs} ms</td>
                <td class="p-1 text-xs text-primary">\${t.rank1To5Count} بار (\${t.topRankSuccessRate}%)</td>
                <td class="p-1 text-xs text-secondary">\${t.rank6To25Count} بار</td>
                <td class="p-1 text-xs \${t.earlyRejectionCount > 0 ? 'text-error' : 'text-outline-variant'}">\${t.earlyRejectionCount} بار</td>
                <td class="p-1 text-xs">
                  <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div class="bg-primary h-full rounded-full" style="width: \${barWidth}%;"></div>
                  </div>
                </td>
              </tr>
            \`;
          });

          card.innerHTML = \`
            <div class="flex items-center justify-between">
              <div>
                <span class="font-bold text-xs text-on-surface">\${sc.scenarioName}</span>
                <span class="text-[11px] text-outline-variant mr-2">پینگ: \${sc.pingMs}ms | نوسان: ±\${sc.jitterMs}ms</span>
              </div>
              <button onclick="applyOptimalLead(\${sc.recommendedLeadTimeMs})" class="text-[11px] bg-secondary/15 hover:bg-secondary hover:text-on-secondary text-secondary px-2 py-0.5 rounded transition">
                اعمال لیدتایم (\${sc.recommendedLeadTimeMs}ms)
              </button>
            </div>
            <table class="w-full text-right text-xs" dir="rtl">
              <thead>
                <tr class="text-outline-variant text-[11px]">
                  <th class="p-1">Lead Time</th>
                  <th class="p-1">رتبه ۱ تا ۵ (طلایی)</th>
                  <th class="p-1">رتبه ۶ تا ۲۵</th>
                  <th class="p-1">رد زودهنگام</th>
                  <th class="p-1">احتمال موفقیت</th>
                </tr>
              </thead>
              <tbody>\${rowsHtml}</tbody>
            </table>
            <div class="text-[11px] text-primary bg-surface-container-lowest px-2 py-1 rounded">
              💡 \${sc.recommendationReason}
            </div>
          \`;

          btScenariosContainer.appendChild(card);
        });
      }
    }

    window.applyOptimalLead = function(lead) {
      if (leadtimeInput) {
        leadtimeInput.value = lead;
        saveLiveConfig();
        alert(\`مقدار لیدتایم روی \${lead} میلی‌ثانیه تنظیم شد.\`);
      }
    };
`;

html = html.replace('loadStatus();', modalJs + '\n    loadStatus();');

fs.writeFileSync('E:/main-projects/saf-shekan/src/public/index.html', html, 'utf8');
console.log('Successfully added Backtest modal & integration to src/public/index.html!');
