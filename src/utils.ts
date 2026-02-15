import { format, differenceInDays, parseISO } from 'date-fns';

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
