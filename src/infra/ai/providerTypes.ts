import type { NioErrorCode } from "../../domain/nio";

type NioProviderId = "gemini" | "groq" | "openai" | "anthropic";

type NioProviderErrorCode = Extract<
  NioErrorCode,
  "PROVIDER_429" | "PROVIDER_5XX" | "STREAM_ERROR"
>;

type NioProviderStreamResult = {
  provider: NioProviderId;
  model: string;
  stream: AsyncIterable<string>;
};

class NioProviderStreamError extends Error {
  readonly code: NioProviderErrorCode;
  readonly status?: number;
  readonly provider?: NioProviderId;

  constructor(
    message: string,
    code: NioProviderErrorCode,
    status?: number,
    provider?: NioProviderId,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.provider = provider;
  }
}

const resolveProviderErrorCode = (status?: number): NioProviderErrorCode => {
  if (status === 429) {
    return "PROVIDER_429";
  }

  if (status && status >= 500 && status <= 599) {
    return "PROVIDER_5XX";
  }

  return "STREAM_ERROR";
};

const createProviderStreamError = (
  message: string,
  status?: number,
  provider?: NioProviderId,
): NioProviderStreamError => {
  return new NioProviderStreamError(
    message,
    resolveProviderErrorCode(status),
    status,
    provider,
  );
};

const isProviderStreamError = (
  error: unknown,
): error is NioProviderStreamError => {
  return error instanceof NioProviderStreamError;
};

export type { NioProviderErrorCode, NioProviderId, NioProviderStreamResult };
export {
  NioProviderStreamError,
  createProviderStreamError,
  isProviderStreamError,
  resolveProviderErrorCode,
};
