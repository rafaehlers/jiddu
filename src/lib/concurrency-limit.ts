type ConcurrencyPermit = {
  release: () => void;
};

const activeByKey = new Map<string, number>();

/**
 * Process-local concurrency guard. Jiddu currently runs as one application
 * container, matching the token-bucket limiter's deployment assumptions.
 */
export function acquireConcurrency(
  key: string,
  maximum: number,
): ConcurrencyPermit | null {
  const limit = Math.max(1, Math.floor(maximum));
  const active = activeByKey.get(key) ?? 0;
  if (active >= limit) return null;

  activeByKey.set(key, active + 1);
  let released = false;
  return {
    release() {
      if (released) return;
      released = true;
      const remaining = (activeByKey.get(key) ?? 1) - 1;
      if (remaining <= 0) {
        activeByKey.delete(key);
      } else {
        activeByKey.set(key, remaining);
      }
    },
  };
}
