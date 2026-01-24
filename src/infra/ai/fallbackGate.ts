import {
  shouldFallbackForStatus,
  shouldFallbackForTimeout,
} from "../../domain/ai-fallback";
import type { NioProviderStreamError } from "./providerTypes";

type FallbackGateInput = {
  hasFirstToken: boolean;
  elapsedMs: number;
  error?: NioProviderStreamError;
};

const shouldFallbackBeforeFirstToken = (input: FallbackGateInput): boolean => {
  if (input.hasFirstToken) {
    return false;
  }

  if (shouldFallbackForTimeout(input.elapsedMs)) {
    return true;
  }

  if (!input.error) {
    return false;
  }

  if (input.error.status) {
    return shouldFallbackForStatus(input.error.status);
  }

  return (
    input.error.code === "PROVIDER_429" || input.error.code === "PROVIDER_5XX"
  );
};

export type { FallbackGateInput };
export { shouldFallbackBeforeFirstToken };
