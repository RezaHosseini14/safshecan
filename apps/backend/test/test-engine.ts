import { CurlParser } from '../src/brokerage/curl-parser.js';
import { BotConfigService } from '../src/bot-config/bot-config.service.js';
import { NestTimeSyncService } from '../src/clock/time-sync.service.js';

async function testAll() {
  console.log('--- TEST 1: cURL Parser ---');
  const sampleCurl = `curl 'https://onlineplus.broker.ir/api/Order/SendOrder' \\
  -H 'Accept: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -H 'Cookie: ASP.NET_SessionId=xyz789' \\
  --data-raw '{"Isin":"IRO1TEST","OrderPrice":{{price}},"OrderQuantity":{{quantity}},"OrderSide":1}'`;

  const parsed = CurlParser.parse(sampleCurl);
  console.log('Parsed URL:', parsed.targetUrl);
  console.log('Parsed Headers count:', Object.keys(parsed.headers).length);
  console.log('Parsed Cookies:', parsed.cookies);

  const injected = CurlParser.injectVariables(parsed.bodyTemplate, {
    symbol: 'فزر',
    price: 32000,
    quantity: 500,
  });
  console.log('Injected body:', injected);

  console.log('\n--- TEST 2: Time Sync ---');
  const timeSync = new NestTimeSyncService(new BotConfigService());
  const status = await timeSync.sync();
  console.log('Sync status:', status);
  console.log('Exact Time now:', NestTimeSyncService.formatTime(timeSync.getExactNow(), true));

  console.log('\n✓ ALL TESTS PASSED!');
}

testAll().catch(console.error);
