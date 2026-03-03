// ==============================
// Time Utilities
// ==============================

/**
 * Convert "HH:MM" string to total minutes.
 */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time format: ${time}`);
  }

  return hours * 60 + minutes;
}

/**
 * Convert total minutes back to "HH:MM" format.
 */
export function toHHMM(totalMinutes: number): string {
  if (totalMinutes < 0) {
    throw new Error(`Minutes cannot be negative: ${totalMinutes}`);
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const paddedHours = hours.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");

  return `${paddedHours}:${paddedMinutes}`;
}

/**
 * Add minutes to a "HH:MM" time string.
 */
export function addMinutes(time: string, minutesToAdd: number): string {
  const total = toMinutes(time) + minutesToAdd;
  return toHHMM(total);
}

/**
 * Return the later of two times.
 */
export function maxTime(timeA: string, timeB: string): string {
  return toMinutes(timeA) >= toMinutes(timeB) ? timeA : timeB;
}
