const fs = require('fs');

let html = fs.readFileSync('E:/main-projects/saf-shekan/src/public/index.html', 'utf8');

// The replacement HTML for the Symbol selector
const oldSymbolSectionStart = '<!-- Symbol Selector & Live Badges -->';
const oldSymbolSectionEnd = '<!-- Price Ceiling (سقف قیمت مجاز) -->';

const startIndex = html.indexOf(oldSymbolSectionStart);
const endIndex = html.indexOf(oldSymbolSectionEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not locate symbol section indexes:', { startIndex, endIndex });
  process.exit(1);
}

const newSymbolHtml = `<!-- Symbol Selector & Live Badges with Comprehensive 350+ Database -->
<div class="flex flex-col gap-space-xs relative">
  <div class="flex items-center justify-between">
    <label class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
      <span>نماد بورسی هدف:</span>
      <span class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">انتخاب از فهرست جامع (۳۵۰+ نماد)</span>
    </label>
    <span class="text-secondary font-data-mono-sm" dir="ltr" id="symbol-isin-label">ISIN: IRO1FAZR0001</span>
  </div>

  <!-- Category filter chips -->
  <div class="flex flex-wrap items-center gap-1 text-[11px] font-body-sm" id="symbol-category-filters">
    <button type="button" data-cat="all" class="sym-filter-btn px-2.5 py-0.5 rounded bg-primary text-on-primary font-bold transition">همه نمادها</button>
    <button type="button" data-cat="ipo" class="sym-filter-btn px-2 py-0.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition border border-outline-variant/30">🔥 عرضه‌های اولیه</button>
    <button type="button" data-cat="gold-etf" class="sym-filter-btn px-2 py-0.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition border border-outline-variant/30">🪙 طلا و اهرم</button>
    <button type="button" data-cat="metals" class="sym-filter-btn px-2 py-0.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition border border-outline-variant/30">🏭 فلزات و پتروشیمی</button>
    <button type="button" data-cat="auto-bank" class="sym-filter-btn px-2 py-0.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition border border-outline-variant/30">🚗 خودرو و بانک</button>
  </div>

  <!-- Symbol Input Box with Dropdown -->
  <div class="grid grid-cols-12 gap-space-xs relative">
    <div class="col-span-9 relative">
      <input class="w-full bg-surface-container-lowest px-space-md py-space-xs text-headline-sm font-headline-sm text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer" id="symbol-input" placeholder="انتخاب یا جستجوی نماد..." type="text" value="فزر" autocomplete="off"/>
      <span class="absolute left-space-sm top-1/2 -translate-y-1/2 text-outline-variant font-data-mono-sm text-data-mono-sm pointer-events-none" dir="ltr" id="symbol-desc-label">Fazar - پویا زرکان</span>
    </div>
    <div class="col-span-3 flex items-center gap-space-xs">
      <button class="w-full h-full bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm rounded-lg flex items-center justify-center gap-space-xs transition-colors" id="btn-toggle-symbols" type="button">
        <span class="material-symbols-outlined text-[18px]">list</span>
        <span>لیست نمادها</span>
      </button>
    </div>

    <!-- Floating Searchable Symbols Dropdown -->
    <div id="symbols-dropdown" class="hidden absolute top-full left-0 right-0 mt-1 z-50 bg-surface-container-low border border-outline-variant/60 rounded-xl shadow-2xl p-space-sm max-h-[400px] flex flex-col gap-space-xs backdrop-blur-xl">
      <div class="relative">
        <input type="text" id="symbol-search-box" placeholder="جستجوی نام نماد یا شرکت (مثلاً: شستا، فزر، فولاد، خودرو، طلا...)" class="w-full bg-surface-container-lowest px-space-md py-space-xs text-xs text-on-surface rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary border border-outline-variant/30" autocomplete="off" />
        <span class="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline-variant text-[16px]">search</span>
      </div>
      <div class="text-[10px] text-outline-variant px-1 flex justify-between">
        <span>نمادهای یافت شده: <span id="symbol-count-badge" class="text-primary font-mono font-bold">0</span></span>
        <span>کلیک کنید تا انتخاب شود</span>
      </div>
      <div id="symbols-list-container" class="overflow-y-auto max-h-[300px] divide-y divide-outline-variant/20 flex flex-col font-body-sm text-body-sm pr-1">
        <!-- Rendered dynamically -->
      </div>
    </div>
  </div>

  <!-- Stock Quick Badges -->
  <div class="flex flex-wrap items-center gap-space-xs mt-1" id="symbol-badges-row">
    <span class="bg-primary/15 text-primary text-body-sm font-body-sm px-space-xs py-0.5 rounded flex items-center gap-1" id="badge-ipo-flag">
      <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
      عرضه اولیه
    </span>
    <span class="bg-surface-container text-on-surface text-body-sm font-body-sm px-space-xs py-0.5 rounded">
      گروه صنعت: <span class="font-bold text-secondary" id="badge-group-name">استخراج کانه‌های فلزی</span>
    </span>
    <span class="bg-surface-container text-on-surface text-body-sm font-body-sm px-space-xs py-0.5 rounded">
      بازار: <span class="font-bold text-primary" id="badge-market-name">فرابورس</span>
    </span>
    <span class="bg-surface-container text-on-surface text-body-sm font-body-sm px-space-xs py-0.5 rounded">
      دامنه نوسان: <span class="font-data-mono-sm text-primary font-bold" dir="ltr">+7%</span>
    </span>
  </div>
</div>
`;

html = html.substring(0, startIndex) + newSymbolHtml + html.substring(endIndex);

// Now append the Symbol Autocomplete JavaScript logic before `loadStatus();` in the script
const scriptTarget = 'loadStatus();\n    connectWs();';
const symbolAutocompleteJs = `
    // -------------------------------------------------------------
    // Comprehensive Symbol Autocomplete & Dropdown System (350+ Symbols)
    // -------------------------------------------------------------
    let allSymbols = [];
    let currentCategoryFilter = 'all';
    const symbolsDropdown = document.getElementById('symbols-dropdown');
    const symbolSearchBox = document.getElementById('symbol-search-box');
    const symbolsListContainer = document.getElementById('symbols-list-container');
    const symbolCountBadge = document.getElementById('symbol-count-badge');
    const btnToggleSymbols = document.getElementById('btn-toggle-symbols');
    const symbolIsinLabel = document.getElementById('symbol-isin-label');
    const symbolDescLabel = document.getElementById('symbol-desc-label');
    const badgeGroupName = document.getElementById('badge-group-name');
    const badgeMarketName = document.getElementById('badge-market-name');
    const badgeIpoFlag = document.getElementById('badge-ipo-flag');

    async function fetchSymbolsDatabase() {
      try {
        const res = await fetch('/api/symbols');
        allSymbols = await res.json();
        renderSymbolsList();
      } catch (err) {
        console.error('Error fetching symbols:', err);
      }
    }

    function renderSymbolsList() {
      if (!symbolsListContainer) return;
      const q = symbolSearchBox ? symbolSearchBox.value.trim().toLowerCase() : '';
      
      let filtered = allSymbols.filter(s => {
        // Category filter
        if (currentCategoryFilter === 'ipo' && !s.isIpo) return false;
        if (currentCategoryFilter === 'gold-etf' && !(s.group.includes('طلا') || s.group.includes('اهرمی'))) return false;
        if (currentCategoryFilter === 'metals' && !(s.group.includes('فلز') || s.group.includes('شیمیایی') || s.group.includes('نفت'))) return false;
        if (currentCategoryFilter === 'auto-bank' && !(s.group.includes('خودرو') || s.group.includes('بانک'))) return false;

        // Query filter
        if (!q) return true;
        return s.symbol.toLowerCase().includes(q) ||
               s.name.toLowerCase().includes(q) ||
               s.group.toLowerCase().includes(q);
      });

      if (symbolCountBadge) symbolCountBadge.textContent = filtered.length;
      symbolsListContainer.innerHTML = '';

      if (filtered.length === 0) {
        symbolsListContainer.innerHTML = \`
          <div class="p-3 text-center text-outline-variant text-xs">
            نمادی یافت نشد. می‌توانید نام دلخواه را دستی بنویسید.
          </div>
        \`;
        return;
      }

      filtered.forEach(s => {
        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-2 hover:bg-surface-container-high cursor-pointer transition-colors rounded group";
        item.innerHTML = \`
          <div class="flex items-center gap-2">
            <span class="font-headline-sm font-bold text-primary group-hover:text-primary-fixed">\${s.symbol}</span>
            <span class="text-xs text-on-surface truncate max-w-[200px]">\${s.name}</span>
            \${s.isIpo ? '<span class="text-[10px] bg-primary/20 text-primary px-1 rounded">عرضه اولیه</span>' : ''}
          </div>
          <div class="flex items-center gap-1.5 text-[10px]">
            <span class="bg-surface-container text-secondary px-1.5 py-0.5 rounded">\${s.group}</span>
            <span class="bg-surface-container-highest text-outline-variant px-1.5 py-0.5 rounded">\${s.market}</span>
          </div>
        \`;

        item.addEventListener('click', () => {
          selectSymbol(s);
        });

        symbolsListContainer.appendChild(item);
      });
    }

    function selectSymbol(s) {
      if (symbolInput) symbolInput.value = s.symbol;
      if (symbolIsinLabel) symbolIsinLabel.textContent = 'ISIN: ' + s.isin;
      if (symbolDescLabel) symbolDescLabel.textContent = s.name;
      if (badgeGroupName) badgeGroupName.textContent = s.group;
      if (badgeMarketName) badgeMarketName.textContent = s.market;
      if (badgeIpoFlag) {
        badgeIpoFlag.style.display = s.isIpo ? 'inline-flex' : 'none';
      }
      closeSymbolsDropdown();
      saveLiveConfig();
    }

    function toggleSymbolsDropdown() {
      if (!symbolsDropdown) return;
      const isHidden = symbolsDropdown.classList.contains('hidden');
      if (isHidden) {
        symbolsDropdown.classList.remove('hidden');
        if (symbolSearchBox) {
          symbolSearchBox.value = '';
          symbolSearchBox.focus();
        }
        renderSymbolsList();
      } else {
        symbolsDropdown.classList.add('hidden');
      }
    }

    function closeSymbolsDropdown() {
      if (symbolsDropdown) symbolsDropdown.classList.add('hidden');
    }

    if (btnToggleSymbols) btnToggleSymbols.addEventListener('click', toggleSymbolsDropdown);
    if (symbolInput) symbolInput.addEventListener('click', toggleSymbolsDropdown);

    if (symbolSearchBox) {
      symbolSearchBox.addEventListener('input', renderSymbolsList);
    }

    // Category Filter Buttons
    const filterButtons = document.querySelectorAll('.sym-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => {
          b.className = "sym-filter-btn px-2 py-0.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition border border-outline-variant/30";
        });
        btn.className = "sym-filter-btn px-2.5 py-0.5 rounded bg-primary text-on-primary font-bold transition";
        currentCategoryFilter = btn.dataset.cat;
        renderSymbolsList();
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (symbolsDropdown && !symbolsDropdown.contains(e.target) &&
          symbolInput && !symbolInput.contains(e.target) &&
          btnToggleSymbols && !btnToggleSymbols.contains(e.target)) {
        closeSymbolsDropdown();
      }
    });

    fetchSymbolsDatabase();
`;

html = html.replace(scriptTarget, symbolAutocompleteJs + '\n    ' + scriptTarget);

fs.writeFileSync('E:/main-projects/saf-shekan/src/public/index.html', html, 'utf8');
console.log('Successfully updated src/public/index.html with full symbol selection system!');
