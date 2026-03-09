import { describe, it, expect } from "vitest";
import { encryptApiKey, decryptApiKey } from "../../convex/lib/crypto";

describe("encryptApiKey / decryptApiKey", () => {
  it("round-trips a key correctly", async () => {
    const secret = "test-secret-value-for-unit-tests-only";
    const original = "sk-proj-abc123xyz";

    const { encryptedKey, iv } = await encryptApiKey(original, secret);
    const decrypted = await decryptApiKey(encryptedKey, iv, secret);

    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext for the same input (random IV)", async () => {
    const secret = "test-secret";
    const key = "AIzaSyExample";

    const first = await encryptApiKey(key, secret);
    const second = await encryptApiKey(key, secret);

    expect(first.encryptedKey).not.toBe(second.encryptedKey);
    expect(first.iv).not.toBe(second.iv);
  });

  it("fails to decrypt with wrong secret", async () => {
    const { encryptedKey, iv } = await encryptApiKey(
      "my-key",
      "correct-secret",
    );

    await expect(
      decryptApiKey(encryptedKey, iv, "wrong-secret"),
    ).rejects.toThrow();
  });
});
