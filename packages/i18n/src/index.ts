import { createTranslator } from 'use-intl/core';
import brokers from '../messages/fa/brokers.json' with { type: 'json' };
import cli from '../messages/fa/cli.json' with { type: 'json' };
import common from '../messages/fa/common.json' with { type: 'json' };
import consoleMessages from '../messages/fa/console.json' with { type: 'json' };
import dossier from '../messages/fa/dossier.json' with { type: 'json' };
import engine from '../messages/fa/engine.json' with { type: 'json' };
import errors from '../messages/fa/errors.json' with { type: 'json' };
import logs from '../messages/fa/logs.json' with { type: 'json' };
import market from '../messages/fa/market.json' with { type: 'json' };
import match from '../messages/fa/match.json' with { type: 'json' };
import queue from '../messages/fa/queue.json' with { type: 'json' };
import reports from '../messages/fa/reports.json' with { type: 'json' };
import shell from '../messages/fa/shell.json' with { type: 'json' };
import speech from '../messages/fa/speech.json' with { type: 'json' };
import swagger from '../messages/fa/swagger.json' with { type: 'json' };
import validation from '../messages/fa/validation.json' with { type: 'json' };
import watcher from '../messages/fa/watcher.json' with { type: 'json' };

export const locale = 'fa' as const;

export const messages = {
  brokers,
  cli,
  common,
  console: consoleMessages,
  dossier,
  engine,
  errors,
  logs,
  market,
  match,
  queue,
  reports,
  shell,
  speech,
  swagger,
  validation,
  watcher,
} as const;

export type I18nMessages = typeof messages;
export type Namespace = keyof I18nMessages;

type Dot<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? K
        : T[K] extends Record<string, unknown>
          ? `${K}.${Dot<T[K]>}`
          : never;
    }[keyof T & string];

export type MessageKey<N extends Namespace> = Dot<I18nMessages[N]>;

type Translator = (key: string, values?: Record<string, string | number>) => string;

const cache = new Map<Namespace, Translator>();

function translatorFor(namespace: Namespace): Translator {
  const cached = cache.get(namespace);
  if (cached) return cached;
  const created = createTranslator({
    locale,
    messages,
    namespace,
  });
  const translator: Translator = (key, values) =>
    (created as unknown as Translator)(key, values);
  cache.set(namespace, translator);
  return translator;
}

export { spokenCardinal, spokenDecimal } from './spoken-number.js';

export function t<N extends Namespace>(
  namespace: N,
  key: MessageKey<N>,
  values?: Record<string, string | number>,
): string {
  return translatorFor(namespace)(key, values);
}
