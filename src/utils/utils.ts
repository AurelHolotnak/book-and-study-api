export function unwrap<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) {
    throw new Error('Value is undefined or null');
  }

  return value;
}

export function hourToMilliseconds(hours: number) {
  return hours * 60 * 60 * 1000;
}
