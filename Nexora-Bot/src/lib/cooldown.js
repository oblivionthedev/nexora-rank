const timestamps = new Map();

export function consumeCooldown(key, durationMs = 2500) {
  const now = Date.now();
  const previous = timestamps.get(key) ?? 0;
  const remaining = durationMs - (now - previous);
  if (remaining > 0) return remaining;
  timestamps.set(key, now);
  if (timestamps.size > 5000) {
    for (const [storedKey, time] of timestamps) {
      if (now - time > durationMs * 4) timestamps.delete(storedKey);
    }
  }
  return 0;
}
