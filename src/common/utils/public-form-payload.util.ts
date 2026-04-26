import { BadRequestException } from '@nestjs/common';

export type PayloadRecord = Record<string, unknown>;

export function getStringValue(payload: PayloadRecord, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return undefined;
}

export function getNumberValue(payload: PayloadRecord, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

export function splitFullName(fullName?: string) {
  const cleaned = fullName?.trim();

  if (!cleaned) {
    return {
      firstName: undefined,
      lastName: undefined,
    };
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : 'N/A',
  };
}

export function combineDetails(parts: Array<string | undefined>) {
  return parts
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.trim())
    .join('\n\n');
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function assertRequiredFields(
  fields: Array<{ label: string; value: unknown }>,
  messagePrefix = 'Missing required fields',
) {
  const missing = fields
    .filter(({ value }) => {
      if (typeof value === 'string') {
        return value.trim().length === 0;
      }
      return value === undefined || value === null;
    })
    .map(({ label }) => label);

  if (missing.length > 0) {
    throw new BadRequestException(`${messagePrefix}: ${missing.join(', ')}`);
  }
}
