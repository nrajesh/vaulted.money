/**
 * True when a recurring transaction's next occurrence falls after its end
 * date, so it must not be created. The end date itself still counts: a
 * schedule ending today still runs today.
 */
export function hasScheduleEnded(
  endDate: string | null | undefined,
  occurrence: Date,
): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return false;
  end.setHours(23, 59, 59, 999);
  return occurrence.getTime() > end.getTime();
}
