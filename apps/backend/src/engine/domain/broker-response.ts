import { t } from '@saf-shekan/i18n';
import type { BrokerAnalysis } from './ports.js';

function readQueueRank(json: Record<string, unknown>): number | undefined {
  const bags = [json, json.Result, json.result, json.data].filter(
    (value): value is Record<string, unknown> => !!value && typeof value === 'object'
  );
  const keys = ['queueRank', 'QueueRank', 'QueuePosition', 'Rank', 'OrderRank', 'queuePosition'];
  for (const bag of bags) {
    for (const key of keys) {
      const rank = Number(bag[key]);
      if (Number.isFinite(rank) && rank > 0) return rank;
    }
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown> | null, key: string): string | undefined {
  if (!record) return undefined;
  const value = record[key];
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return undefined;
}

export function analyzeBrokerResponse(statusCode: number, rawText: string): BrokerAnalysis {
  if (statusCode < 200 || statusCode >= 300) {
    let errorMessage = t('common', 'httpError', { status: statusCode });
    let queueRank: number | undefined;
    try {
      const json = asRecord(JSON.parse(rawText));
      if (json) {
        queueRank = readQueueRank(json);
        const detail = readString(json, 'Message') || readString(json, 'ErrorMessage') || readString(json, 'error');
        if (detail) errorMessage += `: ${detail}`;
      }
    } catch {
      // non-json error body
    }
    return { isSuccess: false, errorMessage, queueRank };
  }

  try {
    const json = asRecord(JSON.parse(rawText));
    if (!json) {
      return { isSuccess: false, errorMessage: rawText.slice(0, 150) };
    }

    const queueRank = readQueueRank(json);
    let isSuccess = false;
    let trackingCode: string | undefined;
    const result = asRecord(json.Result) ?? asRecord(json.data);

    if (json.IsSuccessful === true || json.IsSuccess === true || json.ErrorCode === 0) {
      isSuccess = true;
      trackingCode =
        readString(result, 'OrderId') ||
        readString(result, 'TrackingNumber') ||
        readString(result, 'OrderNumber') ||
        readString(json, 'OrderId') ||
        readString(json, 'OrderNumber');
    }

    if (json.isSuccess === true || json.statusCode === 200) {
      isSuccess = true;
      trackingCode = trackingCode || readString(result, 'orderId') || readString(result, 'trackingCode') || readString(json, 'orderId');
    }

    if (json.Success === true || json.Status === 1) {
      isSuccess = true;
      trackingCode = trackingCode || readString(json, 'TrackingNumber') || readString(json, 'OrderId') || readString(json, 'Id');
    }

    if (!isSuccess && (json.success === true || json.status === 'ok' || json.status === 1)) {
      isSuccess = true;
      trackingCode = trackingCode || readString(json, 'orderId') || readString(json, 'trackingCode') || readString(json, 'id');
    }

    if (!isSuccess) {
      return {
        isSuccess: false,
        queueRank,
        errorMessage:
          readString(json, 'ErrorMessage') ||
          readString(json, 'Message') ||
          readString(json, 'ErrorDescription') ||
          readString(json, 'error') ||
          readString(json, 'title') ||
          rawText.slice(0, 150),
      };
    }

    return { isSuccess: true, trackingCode, queueRank };
  } catch {
    if (
      rawText.includes(t('match', 'registered')) ||
      rawText.includes(t('match', 'success')) ||
      rawText.includes('success')
    ) {
      return { isSuccess: true };
    }
    return { isSuccess: false, errorMessage: rawText.slice(0, 150) };
  }
}
