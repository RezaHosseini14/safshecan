import { createHash, randomBytes } from 'node:crypto';
import { spokenDecimal, t } from '@saf-shekan/i18n';
import WebSocket from 'ws';

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const PERSIAN_VOICE = 'fa-IR-DilaraNeural';
const WIN_EPOCH_SECONDS = 11644473600;
const SPEECH_URL =
  'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';

export function toPersianSpeech(text: string): string {
  const withoutLatin = text.replace(/RSI/g, t('speech', 'rsi'));
  return withoutLatin.replace(/[+-]?\d[\d,.]*/g, (token) => {
    const sign = token.startsWith('+') ? t('speech', 'plus') : token.startsWith('-') ? t('speech', 'minus') : '';
    const raw = token.replace(/^[+-]/, '').replace(/,/g, '');
    const [whole = '0', fraction = ''] = raw.split('.');
    if (!/^\d+$/.test(whole) || (fraction.length > 0 && !/^\d+$/.test(fraction))) return token;
    return `${sign}${spokenDecimal(whole, fraction)}`;
  });
}

export function secMsGec(unixSeconds: number): string {
  let ticks = unixSeconds + WIN_EPOCH_SECONDS;
  ticks -= ticks % 300;
  ticks *= 1e7;
  const stamp = `${Math.round(ticks)}${TRUSTED_CLIENT_TOKEN}`;
  return createHash('sha256').update(stamp, 'ascii').digest('hex').toUpperCase();
}

export function escapeSsml(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildPersianSsml(text: string): string {
  const spoken = escapeSsml(toPersianSpeech(text));
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='fa-IR'>` +
    `<voice name='${PERSIAN_VOICE}'>` +
    `<prosody pitch='+0Hz' rate='-8%' volume='+0%'>${spoken}</prosody>` +
    `</voice></speak>`
  );
}

function edgeTimestamp(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${days[date.getUTCDay()]} ${months[date.getUTCMonth()]} ${pad(date.getUTCDate())} ` +
    `${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} ` +
    `GMT+0000 (Coordinated Universal Time)`
  );
}

function speechHeaders(): Record<string, string> {
  const major = CHROMIUM_FULL_VERSION.split('.')[0] ?? '143';
  return {
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'User-Agent':
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
      `(KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36 Edg/${major}.0.0.0`,
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    Cookie: `muid=${randomBytes(16).toString('hex').toUpperCase()};`,
  };
}

function speechUrl(unixSeconds: number, connectionId: string): string {
  const params = new URLSearchParams({
    TrustedClientToken: TRUSTED_CLIENT_TOKEN,
    ConnectionId: connectionId,
    'Sec-MS-GEC': secMsGec(unixSeconds),
    'Sec-MS-GEC-Version': `1-${CHROMIUM_FULL_VERSION}`,
  });
  return `${SPEECH_URL}?${params.toString()}`;
}

function parseAudioFrame(frame: Buffer): Buffer | null {
  if (frame.length < 2) return null;
  const headerLength = frame.readUInt16BE(0);
  const headerEnd = 2 + headerLength;
  if (headerEnd > frame.length) return null;
  const header = frame.subarray(2, headerEnd).toString('utf8');
  if (!header.includes('Path:audio')) return null;
  const contentType = /Content-Type:([^\r\n]+)/.exec(header)?.[1]?.trim();
  if (contentType !== 'audio/mpeg') return null;
  return frame.subarray(headerEnd);
}

function collectAudio(socket: WebSocket, ssml: string): Promise<Buffer> {
  const requestId = randomBytes(16).toString('hex');
  const timestamp = edgeTimestamp(new Date());
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      finish(new Error('persian speech timed out'));
    }, 20000);
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.removeAllListeners();
      socket.close();
      if (error) reject(error);
      else if (chunks.length === 0) reject(new Error('persian speech returned no audio'));
      else resolve(Buffer.concat(chunks));
    };

    socket.on('message', (data, isBinary) => {
      const frame = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      if (!isBinary) {
        const text = frame.toString('utf8');
        if (text.includes('Path:turn.end')) finish();
        return;
      }
      const audio = parseAudioFrame(frame);
      if (audio && audio.length > 0) chunks.push(audio);
    });
    socket.once('error', (error) => finish(error));
    socket.once('close', (code, reason) => {
      if (chunks.length > 0) finish();
      else finish(new Error(`persian speech closed ${code} ${reason.toString('utf8')}`));
    });

    socket.send(
      `X-Timestamp:${timestamp}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`
    );
    socket.send(
      `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${timestamp}Z\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml
    );
  });
}

function openSpeechSocket(unixSeconds: number): Promise<WebSocket> {
  const connectionId = randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(speechUrl(unixSeconds, connectionId), {
      headers: speechHeaders(),
      perMessageDeflate: true,
    });
    const fail = (error: Error) => {
      socket.removeAllListeners();
      reject(error);
    };
    socket.once('open', () => {
      socket.removeListener('error', fail);
      resolve(socket);
    });
    socket.once('error', fail);
    socket.once('unexpected-response', (_request, response) => {
      response.resume();
      fail(new Error(`persian speech rejected (${response.statusCode ?? 0})`));
    });
  });
}

export async function synthesizePersian(text: string): Promise<Buffer> {
  const spoken = toPersianSpeech(text).trim();
  if (!spoken) throw new Error('empty persian speech');
  const ssml = buildPersianSsml(text);
  let socket = await openSpeechSocket(Date.now() / 1000);
  try {
    return await collectAudio(socket, ssml);
  } catch (error) {
    socket.close();
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('403') && !message.includes('rejected')) throw error;
    socket = await openSpeechSocket(Date.now() / 1000 - 120);
    return collectAudio(socket, ssml);
  }
}
