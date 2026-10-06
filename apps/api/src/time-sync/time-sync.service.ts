import { Injectable, Logger } from '@nestjs/common';
import dgram from 'node:dgram';
import { request } from 'undici';
import { TimeSyncStatus } from '../types/index.js';

@Injectable()
export class NestTimeSyncService {
  private readonly logger = new Logger(NestTimeSyncService.name);
  private offsetMs = 0;
  private rttMs = 0;
  private lastSyncSource = 'None';
  private synchronized = false;
  private lastSyncTime: Date | null = null;

  private readonly defaultNtpServers = [
    'ir.pool.ntp.org',
    'time.google.com',
    'pool.ntp.org',
    'time.cloudflare.com',
  ];

  private readonly defaultHttpServers = [
    'https://api.tsetmc.com',
    'https://time.ir',
    'https://www.tgju.org',
  ];

  public async sync(): Promise<TimeSyncStatus> {
    // مرحله ۱: تلاش برای همگام‌سازی از طریق پروتکل UDP SNTP
    for (const server of this.defaultNtpServers) {
      try {
        const result = await this.queryNtp(server, 123, 2500);
        this.offsetMs = result.offset;
        this.rttMs = result.rtt;
        this.lastSyncSource = `NTP (${server})`;
        this.synchronized = true;
        this.lastSyncTime = new Date();
        this.logger.log(`✓ زمان با ${this.lastSyncSource} کالیبره شد (انحراف: ${this.offsetMs}ms, پینگ: ${this.rttMs}ms)`);
        return this.getStatus();
      } catch {
        // سرور بعدی را تست می‌کنیم
      }
    }

    // مرحله ۲: در صورت مسدود بودن پورت UDP 123، استفاده از HTTP Date
    for (const httpUrl of this.defaultHttpServers) {
      try {
        const result = await this.queryHttpDate(httpUrl, 3000);
        this.offsetMs = result.offset;
        this.rttMs = result.rtt;
        this.lastSyncSource = `HTTP (${new URL(httpUrl).hostname})`;
        this.synchronized = true;
        this.lastSyncTime = new Date();
        this.logger.log(`✓ زمان با ${this.lastSyncSource} کالیبره شد (انحراف: ${this.offsetMs}ms, پینگ: ${this.rttMs}ms)`);
        return this.getStatus();
      } catch {
        // سرور بعدی
      }
    }

    this.logger.warn('⚠ همگام‌سازی زمان ناموفق بود؛ از ساعت محلی سیستم استفاده می‌شود.');
    return this.getStatus();
  }

  public getExactTimestampMs(): number {
    return Date.now() + this.offsetMs;
  }

  public getExactNow(): Date {
    return new Date(this.getExactTimestampMs());
  }

  public getStatus(): TimeSyncStatus {
    return {
      lastSyncTime: this.lastSyncTime,
      offsetMs: this.offsetMs,
      rttMs: this.rttMs,
      source: this.lastSyncSource,
      synchronized: this.synchronized,
    };
  }

  public setManualOffset(offsetMs: number): TimeSyncStatus {
    this.offsetMs = offsetMs;
    this.synchronized = true;
    this.lastSyncSource = 'تنظیم دستی کاربر';
    this.lastSyncTime = new Date();
    this.logger.log(`انحراف دستی زمان تنظیم شد: ${offsetMs}ms`);
    return this.getStatus();
  }

  private queryNtp(host: string, port = 123, timeoutMs = 2500): Promise<{ offset: number; rtt: number }> {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      const packet = Buffer.alloc(48);
      packet[0] = 0x23; // LI = 0, VN = 4, Mode = 3 (Client)

      let timer: NodeJS.Timeout | null = null;
      let finished = false;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        try {
          client.close();
        } catch {}
      };

      timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          cleanup();
          reject(new Error(`NTP timeout on ${host}`));
        }
      }, timeoutMs);

      const t0 = Date.now();

      client.on('error', (err) => {
        if (!finished) {
          finished = true;
          cleanup();
          reject(err);
        }
      });

      client.on('message', (msg) => {
        if (finished) return;
        finished = true;
        const t3 = Date.now();
        cleanup();

        if (msg.length < 48) {
          return reject(new Error('Invalid NTP packet length'));
        }

        const sec = msg.readUInt32BE(40);
        const frac = msg.readUInt32BE(44);

        const NTP_DELTA_SEC = 2208988800;
        const unixSec = sec - NTP_DELTA_SEC;
        const serverMs = unixSec * 1000 + Math.round((frac * 1000) / 0x100000000);

        const rtt = Math.max(0, t3 - t0);
        const estimatedServerNow = serverMs + Math.round(rtt / 2);
        const offset = estimatedServerNow - t3;

        resolve({ offset, rtt });
      });

      client.send(packet, 0, packet.length, port, host, (err) => {
        if (err && !finished) {
          finished = true;
          cleanup();
          reject(err);
        }
      });
    });
  }

  private async queryHttpDate(url: string, timeoutMs = 3000): Promise<{ offset: number; rtt: number }> {
    const t0 = Date.now();
    const res = await request(url, {
      method: 'HEAD',
      headersTimeout: timeoutMs,
    });
    const t3 = Date.now();
    const rtt = Math.max(0, t3 - t0);

    const dateHeader = res.headers['date'];
    if (!dateHeader) {
      throw new Error(`No Date header returned from ${url}`);
    }

    const rawDate = Array.isArray(dateHeader) ? dateHeader[0] : dateHeader;
    const serverTimeMs = new Date(rawDate).getTime();
    if (isNaN(serverTimeMs)) {
      throw new Error(`Invalid Date header format: ${rawDate}`);
    }

    const estimatedServerNow = serverTimeMs + 500 + Math.round(rtt / 2);
    const offset = estimatedServerNow - t3;

    return { offset, rtt };
  }

  public static formatTime(date: Date, includeMs = true): string {
    const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    if (!includeMs) return `${h}:${m}:${s}`;
    const ms = pad(date.getMilliseconds(), 3);
    return `${h}:${m}:${s}.${ms}`;
  }
}
