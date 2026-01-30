/**
 * Type declarations for @wasmer/sdk.
 * The SDK is loaded dynamically at runtime inside the sandbox iframe.
 * It may not be installed as a dependency — the sandbox page loads it on demand.
 */
declare module "@wasmer/sdk" {
  /** Initialize the Wasmer runtime. Must be called once before using other APIs. */
  export function init(options?: { module?: string; token?: string }): Promise<void>;

  export interface WasmerInstance {
    wait(): Promise<{ code: number; stdout: string; stderr: string }>;
    stdin: WritableStream<Uint8Array> | null;
    stdout: ReadableStream<Uint8Array> | null;
    stderr: ReadableStream<Uint8Array> | null;
  }

  export interface WasmerEntrypoint {
    run(options?: {
      args?: string[];
      env?: Record<string, string>;
      stdin?: string;
    }): Promise<WasmerInstance>;
  }

  export interface WasmerPackageHandle {
    entrypoint: WasmerEntrypoint | null;
    commands: Record<string, WasmerEntrypoint>;
  }

  export class Wasmer {
    static fromRegistry(name: string): Promise<WasmerPackageHandle>;
    static createPackage(manifest: unknown): Promise<WasmerPackageHandle>;
  }
}
