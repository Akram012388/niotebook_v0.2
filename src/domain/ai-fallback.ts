const AI_FALLBACK_TIMEOUT_MS = 10_000;

const shouldFallbackForStatus = (status: number): boolean => {
  if (status === 429) {
    return true;
  }

  return status >= 500 && status <= 599;
};

const shouldFallbackForTimeout = (elapsedMs: number): boolean => {
  return elapsedMs >= AI_FALLBACK_TIMEOUT_MS;
};

export {
  AI_FALLBACK_TIMEOUT_MS,
  shouldFallbackForStatus,
  shouldFallbackForTimeout,
};
