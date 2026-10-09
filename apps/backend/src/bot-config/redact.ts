import type { BotConfig } from '@saf-shekan/core';

export const REDACTED_SECRET = '[redacted]';

function isSecretHeader(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === 'authorization' || lower === 'cookie' || lower === 'x-api-key';
}

function headerValue(headers: Record<string, string>, name: string): string | undefined {
  const direct = headers[name];
  if (direct !== undefined) return direct;
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  return match ? headers[match] : undefined;
}

export function redactBotConfig(config: BotConfig): BotConfig {
  const headers = { ...config.network.headers };
  for (const key of Object.keys(headers)) {
    if (isSecretHeader(key) && headers[key]) {
      headers[key] = REDACTED_SECRET;
    }
  }

  return {
    ...config,
    network: {
      ...config.network,
      cookies: config.network.cookies ? REDACTED_SECRET : config.network.cookies,
      headers,
    },
  };
}

export function restoreRedactedSecrets(incoming: Partial<BotConfig>, current: BotConfig): Partial<BotConfig> {
  if (!incoming.network) return incoming;

  const headers = { ...(incoming.network.headers ?? {}) };
  for (const key of Object.keys(headers)) {
    if (isSecretHeader(key) && headers[key] === REDACTED_SECRET) {
      const kept = headerValue(current.network.headers, key);
      if (kept !== undefined) headers[key] = kept;
    }
  }

  const cookies =
    incoming.network.cookies === REDACTED_SECRET ? current.network.cookies : incoming.network.cookies;

  return {
    ...incoming,
    network: {
      ...incoming.network,
      headers,
      cookies,
    },
  };
}
