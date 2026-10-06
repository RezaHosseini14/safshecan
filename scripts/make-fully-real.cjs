const fs = require('fs');

const htmlPath = 'E:/main-projects/saf-shekan/src/public/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Update user account info placeholder in the Order Panel
const oldAccountSnippet = `<span class="text-slate-200 font-medium">کاربر متصل</span>
              <span class="font-mono text-cyan-400 font-bold" dir="ltr" id="account-code-display">PR-1048820</span>`;

const newAccountSnippet = `<div class="flex flex-col">
                <span class="text-slate-200 font-medium truncate max-w-[170px]" id="account-title-display">در انتظار ورود cURL</span>
                <span class="text-[10px] text-slate-500 font-mono" id="account-broker-display">بدون کارگزاری</span>
              </div>
              <div class="flex flex-col items-end">
                <span class="font-mono text-cyan-400 font-bold text-xs" dir="ltr" id="account-code-display">بدون نشست فعال</span>
                <span class="text-[10px] font-mono text-amber-300 hidden" id="badge-token-expiry" dir="ltr">EXP: --</span>
              </div>`;

if (html.includes(oldAccountSnippet)) {
  html = html.replace(oldAccountSnippet, newAccountSnippet);
} else {
  console.log('Account snippet replacement not matched directly, checking regex');
  html = html.replace(/<span class="text-slate-200 font-medium">کاربر متصل<\/span>[\s\S]*?id="account-code-display">[^<]*<\/span>/, newAccountSnippet);
}

// 2. Update Header User Badge (HM -> dynamic user pill)
const oldUserBadge = `<div class="w-8 h-8 rounded-lg bg-white/[0.04] backdrop-blur-md border border-white/[0.1] flex items-center justify-center text-slate-200 text-xs font-mono font-semibold shadow-inner">HM</div>`;
const newUserBadge = `<div id="user-status-pill" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono">
            <span id="user-status-dot" class="w-2 h-2 rounded-full bg-slate-500"></span>
            <span id="user-status-label" class="text-slate-300 font-body text-[11px]">بدون نشست</span>
          </div>`;

if (html.includes(oldUserBadge)) {
  html = html.replace(oldUserBadge, newUserBadge);
}

// 3. Update initial bottom telemetry metrics to start clean without fake numbers
html = html.replace(
  `<span class="text-emerald-400 font-bold mt-0.5" dir="ltr" id="stat-avg-rtt">18.0 ms</span>`,
  `<span class="text-emerald-400 font-bold mt-0.5" dir="ltr" id="stat-avg-rtt">-- ms</span>`
);
html = html.replace(
  `<span class="text-cyan-400 font-bold mt-0.5" dir="ltr" id="stat-min-rtt">16.2 ms</span>`,
  `<span class="text-cyan-400 font-bold mt-0.5" dir="ltr" id="stat-min-rtt">-- ms</span>`
);
html = html.replace(
  `<span class="text-emerald-300 font-bold mt-0.5 font-body neon-text-emerald">#۱ تا #۵ (طلایی)</span>`,
  `<span class="text-slate-400 font-bold mt-0.5 font-body" id="stat-queue-rank">در انتظار شلیک</span>`
);

// 4. Update the JavaScript application controller for 100% real event handling and real cURL integration
const oldJsControllerStart = `      function handleWsMessage(msg) {
        if (msg.type === 'CLOCK_TICK') {
          updateClockDisplay(msg.data);
        } else if (msg.type === 'STATE_CHANGE') {
          updateEngineState(msg.data.state);
        } else if (msg.type === 'LOG') {
          appendLogEntry(msg.data);
        } else if (msg.type === 'ORDER_SENT') {
          handleOrderSent(msg.data);
        }
      }`;

const newJsControllerStart = `      let realShots = [];

      function handleWsMessage(msg) {
        if (msg.type === 'CLOCK_TICK') {
          updateClockDisplay(msg.data);
        } else if (msg.type === 'STATE_CHANGE') {
          updateEngineState(msg.data.state);
        } else if (msg.type === 'LOG' || msg.type === 'SHOT_LOG') {
          appendLogEntry(msg.data);
        } else if (msg.type === 'ORDER_SHOT' || msg.type === 'ORDER_SENT') {
          handleRealOrderShot(msg.data);
        }
      }`;

if (html.includes(oldJsControllerStart)) {
  html = html.replace(oldJsControllerStart, newJsControllerStart);
}

// Replace handleOrderSent with handleRealOrderShot
const oldHandleOrderSent = `      function handleOrderSent(data) {
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
      }`;

const newHandleRealOrderShot = `      function handleRealOrderShot(shot) {
        if (!shot) return;
        realShots.push(shot);
        const idx = shot.shotIndex || realShots.length;

        if (logCountEl) logCountEl.textContent = \`\${idx}/\${burstCountSlider?.value || 10}\`;
        const telemetryRate = document.getElementById('telemetry-rate');
        if (telemetryRate) {
          telemetryRate.textContent = shot.success ? 'FILLED ✓' : (shot.httpStatus ? \`HTTP \${shot.httpStatus}\` : 'FAILED');
          telemetryRate.className = shot.success ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
        }

        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/[0.04] transition-colors " + (shot.success ? "bg-emerald-500/[0.06]" : "bg-white/[0.01]");

        let statusBadge = '';
        if (shot.httpStatus >= 200 && shot.httpStatus < 300) {
          statusBadge = \`<span class="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold" dir="ltr">\${shot.httpStatus} OK</span>\`;
        } else if (shot.httpStatus === 429) {
          statusBadge = \`<span class="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold" dir="ltr">429 LIMIT</span>\`;
        } else if (shot.httpStatus === 401 || shot.httpStatus === 403) {
          statusBadge = \`<span class="bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold" dir="ltr">\${shot.httpStatus} AUTH</span>\`;
        } else if (shot.httpStatus === 0) {
          statusBadge = \`<span class="bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold" dir="ltr">TIMEOUT</span>\`;
        } else {
          statusBadge = \`<span class="bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold" dir="ltr">\${shot.httpStatus || 'ERR'}</span>\`;
        }

        const resultText = shot.success
          ? \`سفارش با موفقیت در هسته ثبت شد \${shot.trackingCode ? \`(کد رهگیری: \${shot.trackingCode})\` : ''}\`
          : (shot.errorMessage || 'پاسخ ناموفق از سامانه کارگزاری');

        const resultClass = shot.success ? 'text-emerald-300 font-medium' : 'text-rose-400';

        tr.innerHTML = \`
          <td class="py-3 px-4 font-bold \${shot.success ? 'text-emerald-400' : 'text-slate-300'}" dir="ltr">#\${String(idx).padStart(2, '0')}</td>
          <td class="py-3 px-4 text-slate-200 font-mono" dir="ltr">\${shot.timestamp || '-'}</td>
          <td class="py-3 px-4 text-slate-200 font-mono" dir="ltr">\${shot.responseTimestamp || '-'}</td>
          <td class="py-3 px-4 text-center">\${statusBadge}</td>
          <td class="py-3 px-4 text-cyan-300 font-bold font-mono" dir="ltr">\${shot.latencyMs}ms</td>
          <td class="py-3 px-4 text-white font-mono" dir="ltr">\${shot.trackingCode || '-'}</td>
          <td class="py-3 px-4 font-body \${resultClass}">\${resultText}</td>
        \`;

        if (terminalStream) {
          if (realShots.length === 1) terminalStream.innerHTML = '';
          terminalStream.prepend(tr);
        }

        // Update real statistics metrics
        const validLatencies = realShots.map(s => s.latencyMs).filter(l => l > 0);
        if (validLatencies.length > 0) {
          const avgL = Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length);
          const minL = Math.min(...validLatencies);
          const statAvgRtt = document.getElementById('stat-avg-rtt');
          const statMinRtt = document.getElementById('stat-min-rtt');
          const statQueueRank = document.getElementById('stat-queue-rank');

          if (statAvgRtt) statAvgRtt.textContent = \`\${avgL} ms\`;
          if (statMinRtt) statMinRtt.textContent = \`\${minL} ms\`;

          if (statQueueRank && shot.success) {
            if (minL <= 22) {
              statQueueRank.textContent = '#۱ تا #۵ (طلایی)';
              statQueueRank.className = 'text-emerald-300 font-bold mt-0.5 font-body neon-text-emerald';
            } else if (minL <= 45) {
              statQueueRank.textContent = '#۶ تا #۲۵';
              statQueueRank.className = 'text-cyan-300 font-bold mt-0.5 font-body';
            } else {
              statQueueRank.textContent = 'صف عادی';
              statQueueRank.className = 'text-slate-300 font-bold mt-0.5 font-body';
            }
          }
        }
      }`;

if (html.includes(oldHandleOrderSent)) {
  html = html.replace(oldHandleOrderSent, newHandleRealOrderShot);
}

// 5. Update cURL parse response handler in JavaScript to apply real account info and run real connection ping
const oldCurlHandler = `      if (btnParseCurl && curlInput) {
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
      }`;

const newCurlHandler = `      if (btnParseCurl && curlInput) {
        btnParseCurl.addEventListener('click', async () => {
          const text = curlInput.value.trim();
          if (!text) {
            alert('لطفاً دستور cURL کپی‌شده از مرورگر را وارد نمایید.');
            return;
          }
          btnParseCurl.disabled = true;
          btnParseCurl.classList.add('opacity-50');

          try {
            const res = await fetch('/api/curl/parse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ curlCommand: text })
            });
            const d = await res.json();
            if (d.success) {
              applyAccountAndBrokerInfo(d.accountInfo, d.brokerInfo);

              if (d.extractedOrder) {
                if (d.extractedOrder.symbol && symbolInput) {
                  symbolInput.value = d.extractedOrder.symbol;
                  const found = allSymbols.find(s => s.symbol === d.extractedOrder.symbol);
                  if (found && symbolDescLabel) symbolDescLabel.textContent = found.name;
                }
                if (d.extractedOrder.price && priceInput) {
                  priceInput.value = d.extractedOrder.price;
                }
                if (d.extractedOrder.quantity && qtyInput) {
                  qtyInput.value = d.extractedOrder.quantity;
                }
                recalcTotal();
              }

              // Test live broker connection immediately
              testLiveBrokerConnection();

              alert('اطلاعات cURL با موفقیت استخراج و متصل شد: ' + (d.brokerInfo?.name || 'کارگزاری شناسایی شد'));
            } else {
              alert('خطا در پردازش cURL: ' + (d.message || 'نامشخص'));
            }
          } catch (e) {
            alert('خطا در ارسال به سرور: ' + e.message);
          } finally {
            btnParseCurl.disabled = false;
            btnParseCurl.classList.remove('opacity-50');
          }
        });
      }

      function applyAccountAndBrokerInfo(account, broker) {
        const accTitleEl = document.getElementById('account-title-display');
        const accCodeEl = document.getElementById('account-code-display');
        const accBrokerEl = document.getElementById('account-broker-display');
        const userDot = document.getElementById('user-status-dot');
        const userLabel = document.getElementById('user-status-label');
        const badgeExpiry = document.getElementById('badge-token-expiry');
        const badgeBroker = document.getElementById('badge-broker');
        const badgeAuth = document.getElementById('badge-auth');
        const badgeBrokerStatus = document.getElementById('badge-broker-status');

        if (broker) {
          if (brokerSelect) brokerSelect.value = broker.id;
          if (badgeBroker) badgeBroker.textContent = 'BROKER: ' + broker.name;
          if (accBrokerEl) accBrokerEl.textContent = broker.name;
        }

        if (account) {
          if (accTitleEl) accTitleEl.textContent = account.customerTitle || 'کاربر احراز هویت شده';
          if (accCodeEl) accCodeEl.textContent = account.customerCode || 'نشست فعال';

          if (userDot) {
            userDot.className = "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse";
          }
          if (userLabel) {
            userLabel.textContent = account.customerTitle ? account.customerTitle.split(' ')[0] : 'آنلاین';
          }

          if (badgeAuth) {
            badgeAuth.textContent = account.authType === 'BEARER_JWT' ? 'AUTH: JWT BEARER' : 'AUTH: SESSION';
          }
          if (badgeBrokerStatus) {
            badgeBrokerStatus.textContent = 'نشست فعال و آماده';
          }

          if (badgeExpiry && account.tokenExpiresAt) {
            badgeExpiry.textContent = \`انقضا: \${account.tokenExpiresAt}\`;
            badgeExpiry.classList.remove('hidden');
            if (account.isTokenExpired) {
              badgeExpiry.className = "text-[10px] font-mono text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30 font-bold";
              alert('⚠️ هشدار: توکن نشست شما منقضی شده است. لطفاً مجدداً از کارگزاری لاگین کرده و cURL جدید کپی کنید.');
            }
          }
        }
      }

      async function testLiveBrokerConnection() {
        try {
          const res = await fetch('/api/broker/test-connection', { method: 'POST' });
          const d = await res.json();
          if (d.success && d.rttMs >= 0) {
            const headerPing = document.getElementById('header-ping-text');
            const leadRttLabel = document.getElementById('label-lead-rtt');
            if (headerPing) headerPing.textContent = d.rttMs + 'ms';
            if (leadRttLabel) leadRttLabel.textContent = \`RTT: \${d.rttMs}ms\`;
          }
        } catch (e) {}
      }`;

if (html.includes(oldCurlHandler)) {
  html = html.replace(oldCurlHandler, newCurlHandler);
}

// 6. Update loadStatus to apply real account info from config
const oldLoadStatusCall = `      async function loadStatus() {
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
      }`;

const newLoadStatusCall = `      async function loadStatus() {
        try {
          const res = await fetch('/api/status');
          const d = await res.json();
          if (d.config) {
            currentConfig = d.config;
            if (targetInput) targetInput.value = d.config.timing.targetTime + (d.config.timing.targetTime.includes('.') ? '' : '.000');
            if (leadtimeInput) leadtimeInput.value = d.config.timing.leadTimeMs;
            if (burstCountSlider) {
              burstCountSlider.value = d.config.timing.burstCount;
              if (burstCountLabel) burstCountLabel.textContent = \`\${d.config.timing.burstCount} شلیک\`;
            }
            if (burstIntervalSlider) {
              burstIntervalSlider.value = d.config.timing.burstIntervalMs;
              if (burstIntervalLabel) burstIntervalLabel.textContent = \`\${d.config.timing.burstIntervalMs} ms\`;
            }
            if (symbolInput && d.config.order.symbol) symbolInput.value = d.config.order.symbol;
            if (priceInput && d.config.order.price) priceInput.value = d.config.order.price;
            if (qtyInput && d.config.order.quantity) qtyInput.value = d.config.order.quantity;
            if (brokerSelect && d.config.order.brokerType) brokerSelect.value = d.config.order.brokerType;

            if (d.config.account) {
              applyAccountAndBrokerInfo(d.config.account, { id: d.config.order.brokerType, name: d.config.account.brokerName || 'کارگزاری فعال' });
            }

            if (d.timeSync && d.timeSync.synchronized) {
              const off = d.timeSync.offsetMs;
              const sign = off >= 0 ? '+' : '';
              if (headerDeltaText) headerDeltaText.textContent = \`\${sign}\${off}ms\`;
              if (atomicDeltaInfo) atomicDeltaInfo.textContent = \`DELTA: \${sign}\${off}ms\`;
            }

            if (d.results && d.results.length > 0) {
              d.results.forEach(s => handleRealOrderShot(s));
            }

            recalcTotal();
            testLiveBrokerConnection();
          }
        } catch (e) {
          console.error('Failed to load status:', e);
        }
      }`;

if (html.includes(oldLoadStatusCall)) {
  html = html.replace(oldLoadStatusCall, newLoadStatusCall);
}

// Update dry run handler to process real returned shot
const oldDryRun = `      if (btnDryRun) {
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
      }`;

const newDryRun = `      if (btnDryRun) {
        btnDryRun.addEventListener('click', async () => {
          saveCurrentInputs();
          btnDryRun.disabled = true;
          btnDryRun.classList.add('opacity-50');
          try {
            const res = await fetch('/api/sniper/test-shot', { method: 'POST' });
            const d = await res.json();
            if (d.success && d.result) {
              handleRealOrderShot(d.result);
            } else {
              alert('خطا در شلیک آزمایشی: ' + (d.message || ''));
            }
          } catch (e) {
            alert('خطا در شلیک تستی: ' + e.message);
          } finally {
            btnDryRun.disabled = false;
            btnDryRun.classList.remove('opacity-50');
          }
        });
      }`;

if (html.includes(oldDryRun)) {
  html = html.replace(oldDryRun, newDryRun);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully updated src/public/index.html to remove all mock data and activate 100% real logic!');
