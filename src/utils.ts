import { format, differenceInDays, parseISO } from 'date-fns';
import type { Language } from './types';

export function formatDateRange(start: string, end: string | null): string {
  const s = parseISO(start);
  if (!end) return `${format(s, 'MMM d, yyyy')} — Ongoing`;
  const e = parseISO(end);
  if (format(s, 'MMM yyyy') === format(e, 'MMM yyyy')) {
    return `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`;
  }
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
}

export function periodDuration(start: string, end: string | null): number {
  if (!end) return differenceInDays(new Date(), parseISO(start)) + 1;
  return differenceInDays(parseISO(end), parseISO(start)) + 1;
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function cycleLengthBetween(
  currentStart: string,
  previousStart: string
): number {
  return differenceInDays(parseISO(currentStart), parseISO(previousStart));
}

export function formatRelativeTime(isoString: string, lang: Language): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (lang === 'ru') {
    if (seconds < 60) return 'только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    return `${days} дн. назад`;
  }

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
