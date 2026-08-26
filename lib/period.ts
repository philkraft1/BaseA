export const PERIOD_OPTIONS = [
  { days: 7, label: 'Weekly' },
  { days: 14, label: 'Every 2 weeks' },
  { days: 30, label: 'Monthly' },
] as const

export const DAY_SECONDS = 86_400

export function daysToPeriod(days: number): bigint {
  return BigInt(days) * BigInt(DAY_SECONDS)
}

export function periodToDays(period: bigint | number): number {
  return Number(period) / DAY_SECONDS
}

export function formatDueDate(unixSeconds: bigint | number): string {
  const n = Number(unixSeconds)
  if (!n) return 'Now'
  return new Date(n * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
