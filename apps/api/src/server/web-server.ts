import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { ConfigManager } from '../config/config-manager.js';
import { TimeSyncService } from '../core/time-sync.js';
import { ConnectionManager } from '../core/connection-pool.js';
import { SniperEngine } from '../core/sniper-engine.js';
import { CurlParser } from '../brokers/curl-parser.js';
import { BROKER_PRESETS } from '../brokers/broker-presets.js';
import { ServerBroadcastMessage } from '../types/index.js';
import { BacktestRunner } from '../simulation/backtest-runner.js';
import { HistoricalBacktester } from '../simulation/historical-backtester.js';
import { SymbolsService } from '../symbols/symbols.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebDashboardServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private configManager: ConfigManager;
  private timeSync: TimeSyncService;
  private connectionManager: ConnectionManager;
  private engine: SniperEngine;
  private symbolsService: SymbolsService;
  private clockInterval: NodeJS.Timeout | null = null;

  constructor(
    configManager: ConfigManager,
    timeSync: TimeSyncService,
    connectionManager: ConnectionManager,
    engine: SniperEngine
  ) {
    this.configManager = configManager;
    this.timeSync = timeSync;
    this.connectionManager = connectionManager;
    this.engine = engine;
    this.symbolsService = new SymbolsService();

    this.app = express();
    this.app.use(express.json({ limit: '10mb' }));

    // هدرهای امنیتی پیشرفته (Enterprise Security Headers)
    this.app.use((req, res, next) => {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // یافتن پوشه فایل‌های استاتیک - اولویت با خروجی Next.js در frontend/out
    const publicPath = [
      path.resolve(process.cwd(), 'frontend/out'),
      path.resolve(__dirname, '../../frontend/out'),
      path.resolve(__dirname, '../public'),
      path.resolve(__dirname, '../../src/public'),
      path.resolve(process.cwd(), 'src/public'),
      path.resolve(process.cwd(), 'dist/public'),
    ].find((p) => fs.existsSync(p)) || path.resolve(__dirname, '../public');

    this.app.use(express.static(publicPath));

    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server, path: '/ws' });

    this.setupRoutes();
    this.setupWebSockets();
    this.setupEngineListeners();
  }

  private setupRoutes(): void {
    // مسیر صفحه گزارش‌ها و آرشیو شلیک‌ها
    this.app.get(['/reports', '/reports.html'], (req, res) => {
      const publicPath = [
        path.resolve(process.cwd(), 'frontend/out'),
        path.resolve(__dirname, '../../frontend/out'),
        path.resolve(__dirname, '../public'),
        path.resolve(__dirname, '../../src/public'),
        path.resolve(process.cwd(), 'src/public'),
        path.resolve(process.cwd(), 'dist/public'),
      ].find((p) => fs.existsSync(p)) || path.resolve(__dirname, '../public');
      
      const file = path.join(publicPath, 'reports.html');
      if (fs.existsSync(file)) {
        res.sendFile(file);
      } else {
        res.redirect('/');
      }
    });

    // دریافت تاریخچه و شلیک‌های زنده موتور سرخطی
    this.app.get('/api/reports', (req, res) => {
      res.json({
        success: true,
        results: this.engine.getResults(),
        state: this.engine.getState(),
        timeSync: this.timeSync.getStatus(),
      });
    });

    // دریافت فهرست جامع نمادهای بورس و فرابورس با قابلیت جستجو و فیلتر عرضه اولیه
    this.app.get('/api/symbols', (req, res) => {
      try {
        const query = typeof req.query.q === 'string' ? req.query.q : undefined;
        const onlyIpo = req.query.onlyIpo === 'true' || req.query.onlyIpo === '1';
        const market = typeof req.query.market === 'string' ? req.query.market : undefined;
        res.json(this.symbolsService.search(query, onlyIpo, market));
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // فهرست ویژه عرضه‌های اولیه فعال و آتی
    this.app.get('/api/symbols/ipos', (req, res) => {
      try {
        res.json(this.symbolsService.getIpos());
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // وضعیت همگام‌سازی نمادها
    this.app.get('/api/symbols/status', (req, res) => {
      res.json(this.symbolsService.getStatus());
    });

    // همگام‌سازی آنی از بورس (TSETMC)
    this.app.post('/api/symbols/refresh', async (req, res) => {
      try {
        const result = await this.symbolsService.syncFromTsetmc();
        res.json(result);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // دریافت تنظیمات جاری، وضعیت موتور و کارگزاری‌ها
    this.app.get('/api/status', (req, res) => {
      res.json({
        config: this.configManager.getConfig(),
        state: this.engine.getState(),
        timeSync: this.timeSync.getStatus(),
        results: this.engine.getResults(),
        presets: BROKER_PRESETS,
      });
    });

    // ذخیره تنظیمات جدید
    this.app.post('/api/config', (req, res) => {
      try {
        const newConfig = req.body;
        this.configManager.save(newConfig);
        this.engine.updateConfig(newConfig);
        res.json({ success: true, message: 'تنظیمات با موفقیت ذخیره شد.' });
      } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
      }
    });

    // اعمال قالب کارگزاری پیش‌فرض
    this.app.post('/api/presets/apply', (req, res) => {
      const { presetId } = req.body;
      this.configManager.applyPreset(presetId);
      this.engine.updateConfig(this.configManager.getConfig());
      res.json({ success: true, config: this.configManager.getConfig() });
    });

    // تحلیل و استخراج اطلاعات از دستور cURL
    this.app.post('/api/curl/parse', (req, res) => {
      try {
        const rawCurl = req.body.curl || req.body.curlCommand;
        if (!rawCurl) {
          return res.status(400).json({ success: false, message: 'دستور cURL ارسال نشده است.' });
        }
        const parsed = CurlParser.parseAdvanced(rawCurl);
        const currentConfig = this.configManager.getConfig();

        currentConfig.network = {
          ...currentConfig.network,
          ...parsed.network,
        };
        currentConfig.order.brokerType = parsed.broker.id as any;

        if (parsed.extractedOrder.symbol) {
          currentConfig.order.symbol = parsed.extractedOrder.symbol;
        }
        if (parsed.extractedOrder.price) {
          currentConfig.order.price = parsed.extractedOrder.price;
        }
        if (parsed.extractedOrder.quantity) {
          currentConfig.order.quantity = parsed.extractedOrder.quantity;
        }
        if (parsed.account) {
          currentConfig.account = parsed.account;
        }

        this.configManager.save(currentConfig);
        this.engine.updateConfig(currentConfig);

        res.json({
          success: true,
          parsed,
          network: parsed.network,
          brokerInfo: parsed.broker,
          accountInfo: parsed.account,
          extractedOrder: parsed.extractedOrder,
          config: currentConfig,
        });
      } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
      }
    });

    // تست اتصال زنده و اعتبار هدرها با سرور کارگزاری
    this.app.post('/api/broker/test-connection', async (req, res) => {
      try {
        const cfg = this.configManager.getConfig();
        const url = req.body.url || cfg.network.targetUrl;
        const headers = req.body.headers || cfg.network.headers;
        const rttMs = await this.connectionManager.preWarm(url, headers);
        res.json({
          success: rttMs >= 0,
          rttMs,
          url,
          message: rttMs >= 0 ? `اتصال برقرار شد (${rttMs}ms)` : 'خطا در برقراری اتصال با سرور کارگزاری',
        });
      } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    // اجرای شبیه‌سازی و بک‌تست جامع بازگشایی بازار
    this.app.post('/api/backtest/run', async (req, res) => {
      try {
        const runs = Math.min(10, Math.max(3, Number(req.body.runs) || 5));
        const report = await BacktestRunner.runFullBacktest(runs);
        res.json({ success: true, report });
      } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    // دریافت لیست عرضه‌های اولیه تاریخی بورس
    this.app.get('/api/historical/ipos', (req, res) => {
      try {
        const ipos = HistoricalBacktester.loadHistoricalIPOs();
        res.json({ success: true, count: ipos.length, ipos });
      } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    // اجرای بک‌تست تاریخی و شبیه‌سازی کارنامه روی سوابق بورس
    this.app.post('/api/historical/backtest', (req, res) => {
      try {
        const config = {
          initialCapitalToman: Number(req.body.initialCapitalToman) || 50_000_000,
          allocationMode: req.body.allocationMode === 'percent' ? 'percent' : 'fixed',
          fixedAllocationToman: Number(req.body.fixedAllocationToman) || 10_000_000,
          positionSizingPercent: Number(req.body.positionSizingPercent) || 30,
          connectionType: req.body.connectionType || 'fiber',
          leadTimeMs: typeof req.body.leadTimeMs === 'number' ? Number(req.body.leadTimeMs) : undefined,
          burstCount: Number(req.body.burstCount) || 5,
          burstIntervalMs: Number(req.body.burstIntervalMs) || 2.5,
          targetSymbols: Array.isArray(req.body.targetSymbols) && req.body.targetSymbols.length > 0 ? req.body.targetSymbols : undefined
        };
        const report = HistoricalBacktester.runBacktest(config as any);
        res.json({ success: true, report });
      } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    // همگام‌سازی زمان با سرورهای NTP و HTTP
    this.app.post('/api/time/sync', async (req, res) => {
      try {
        const status = await this.timeSync.sync();
        this.broadcast({
          type: 'TIME_SYNC',
          data: status,
        });
        res.json({ success: true, status });
      } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    // تنظیم دستی اختلاف زمان (Manual Offset)
    this.app.post('/api/time/offset', (req, res) => {
      const { offsetMs } = req.body;
      this.timeSync.setManualOffset(Number(offsetMs) || 0);
      res.json({ success: true, status: this.timeSync.getStatus() });
    });

    // تست پینگ و تاخیر سرور کارگزاری
    this.app.post('/api/network/ping', async (req, res) => {
      const url = req.body.url || this.configManager.getConfig().network.targetUrl;
      const pingMs = await this.connectionManager.pingBroker(url);
      res.json({ success: true, pingMs });
    });

    // آماده‌باش برای سرخطی در زمان هدف (Arm)
    this.app.post('/api/sniper/arm', (req, res) => {
      const result = this.engine.arm();
      res.json(result);
    });

    // لغو آماده‌باش (Disarm)
    this.app.post('/api/sniper/disarm', (req, res) => {
      this.engine.disarm();
      res.json({ success: true, message: 'موتور سرخطی غیرفعال شد.' });
    });

    // شلیک تستی فوری (Dry Run / Test Shot)
    this.app.post('/api/sniper/test-shot', async (req, res) => {
      try {
        const shotResult = await this.engine.testManualShoot();
        res.json({ success: true, result: shotResult });
      } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
      }
    });
  }

  private setupWebSockets(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      // ارسال آخرین وضعیت بلافاصله پس از اتصال
      ws.send(
        JSON.stringify({
          type: 'STATE_CHANGE',
          data: {
            state: this.engine.getState(),
            timeSync: this.timeSync.getStatus(),
          },
        })
      );
    });

    // تیک دقیق ساعت اتمی هر ۱۰۰ میلی‌ثانیه برای به‌روزرسانی نمایشگر میلی‌ثانیه‌ای در UI
    this.clockInterval = setInterval(() => {
      if (this.wss.clients.size === 0) return;

      const exactNow = this.timeSync.getExactNow();
      const timeStr = TimeSyncService.formatTime(exactNow, true);
      const targetTimeStr = this.configManager.getConfig().timing.targetTime;

      this.broadcast({
        type: 'CLOCK_TICK',
        data: {
          currentExactTime: timeStr,
          timestampMs: exactNow.getTime(),
          state: this.engine.getState(),
          targetTime: targetTimeStr,
        },
      });
    }, 100);
  }

  private setupEngineListeners(): void {
    this.engine.on('state_changed', (state) => {
      this.broadcast({
        type: 'STATE_CHANGE',
        data: { state },
      });
    });

    this.engine.on('log', (logEntry) => {
      this.broadcast({
        type: 'SHOT_LOG',
        data: logEntry,
      });
    });

    this.engine.on('shot_result', (shot) => {
      this.broadcast({
        type: 'ORDER_SHOT',
        data: shot,
      });
      this.broadcast({
        type: 'SHOT_LOG',
        data: {
          level: shot.success ? 'success' : 'warn',
          text: `[شلیک ${shot.shotIndex}] کد ${shot.httpStatus} | تاخیر: ${shot.latencyMs}ms | ${shot.errorMessage || (shot.trackingCode ? `کد رهگیری: ${shot.trackingCode}` : 'پاسخ دریافت شد')}`,
          shot,
        },
      });
    });

    this.engine.on('sniper_completed', (results) => {
      this.broadcast({
        type: 'SNIPER_SUMMARY',
        data: { results },
      });
    });
  }

  public broadcast(message: ServerBroadcastMessage): void {
    const raw = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  public start(port: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server.listen(port, () => {
        resolve(port);
      });
      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // در صورت اشغال بودن پورت ۳۸۸۰، پورت بعدی را امتحان می‌کنیم
          this.server.listen(port + 1, () => {
            resolve(port + 1);
          });
        } else {
          reject(err);
        }
      });
    });
  }

  public stop(): Promise<void> {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }
}
