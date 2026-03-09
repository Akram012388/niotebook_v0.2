import { describe, it, expect } from "vitest";
import { makeTestEnv, api } from "./setup";

// A stable token that convex-test's withIdentity will use.
const TOKEN_IDENTIFIER = "https://convex.test|user-apikeys-test";

// A dummy encryption secret for tests (32+ chars → safe for AES-256-GCM).
// Set once at module level so it is always present for all tests.
process.env.NIOTEBOOK_KEY_ENCRYPTION_SECRET =
  "test-secret-key-for-vitest-only-12345";

type Provider = "gemini" | "openai" | "anthropic";

type KeyHint = {
  provider: Provider;
  keyHint: string;
  isActive: boolean;
};

async function seedUser(t: ReturnType<typeof makeTestEnv>): Promise<void> {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: TOKEN_IDENTIFIER,
      role: "user",
    });
  });
}

async function listHints(
  tWithId: ReturnType<ReturnType<typeof makeTestEnv>["withIdentity"]>,
): Promise<KeyHint[]> {
  return (await tWithId.query(api.userApiKeys.listHints)) as KeyHint[];
}

describe("userApiKeys — save + listHints", () => {
  it("saving a key for a provider makes it appear in listHints", async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    await tWithId.action(api.userApiKeys.save, {
      provider: "gemini",
      key: "test-gemini-api-key-12345",
    });

    const hints = await listHints(tWithId);
    expect(hints).toHaveLength(1);
    expect(hints[0].provider).toBe("gemini");
    // keyHint is the last 4 characters of the key
    expect(hints[0].keyHint).toBe("2345");
    // First saved key is auto-selected as active
    expect(hints[0].isActive).toBe(true);
  });

  it("saving a second provider adds it without removing the first", async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    await tWithId.action(api.userApiKeys.save, {
      provider: "gemini",
      key: "test-gemini-key-0001",
    });
    await tWithId.action(api.userApiKeys.save, {
      provider: "openai",
      key: "test-openai-key-0002",
    });

    const hints = await listHints(tWithId);
    expect(hints).toHaveLength(2);

    const providers = hints.map((h) => h.provider).sort();
    expect(providers).toEqual(["gemini", "openai"]);
  });
});

describe("userApiKeys — remove", () => {
  it("removes the key so listHints no longer shows it", async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    await tWithId.action(api.userApiKeys.save, {
      provider: "gemini",
      key: "test-gemini-key-remove",
    });

    expect(await listHints(tWithId)).toHaveLength(1);

    await tWithId.mutation(api.userApiKeys.remove, { provider: "gemini" });

    expect(await listHints(tWithId)).toHaveLength(0);
  });

  it("removing the active provider clears activeAiProvider on the user", async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    await tWithId.action(api.userApiKeys.save, {
      provider: "gemini",
      key: "test-gemini-only-key",
    });

    const hintsBefore = await listHints(tWithId);
    expect(hintsBefore[0].isActive).toBe(true);

    await tWithId.mutation(api.userApiKeys.remove, { provider: "gemini" });

    const userAfter = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", TOKEN_IDENTIFIER),
        )
        .first(),
    );
    expect(userAfter?.activeAiProvider).toBeUndefined();
  });
});

describe("userApiKeys — setActiveProvider", () => {
  it("switches the active provider to the specified one", async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    await tWithId.action(api.userApiKeys.save, {
      provider: "gemini",
      key: "test-gemini-switch-key",
    });
    await tWithId.action(api.userApiKeys.save, {
      provider: "openai",
      key: "test-openai-switch-key",
    });

    await tWithId.mutation(api.userApiKeys.setActiveProvider, {
      provider: "openai",
    });

    const hints = await listHints(tWithId);
    const openaiHint = hints.find((h) => h.provider === "openai");
    const geminiHint = hints.find((h) => h.provider === "gemini");

    expect(openaiHint?.isActive).toBe(true);
    expect(geminiHint?.isActive).toBe(false);
  });

  it("throws when no key exists for the target provider", async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    await expect(
      tWithId.mutation(api.userApiKeys.setActiveProvider, {
        provider: "anthropic",
      }),
    ).rejects.toThrow("No saved key for provider: anthropic");
  });
});

describe("userApiKeys — resolveForRequest", () => {
  it("returns the active provider and decrypted key", async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    const plainKey = "test-resolve-api-key-9876";
    await tWithId.action(api.userApiKeys.save, {
      provider: "gemini",
      key: plainKey,
    });

    const result = await tWithId.action(api.userApiKeys.resolveForRequest);

    expect(result).not.toBeNull();
    expect(result?.provider).toBe("gemini");
    expect(result?.key).toBe(plainKey);
  });

  it("returns null when no key is saved", async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const result = await t
      .withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER })
      .action(api.userApiKeys.resolveForRequest);

    expect(result).toBeNull();
  });
});

describe("userApiKeys — internal helpers", () => {
  it.todo(
    "_upsertKey + _getKeysByUser: add coverage once generated internal API exports these symbols",
  );
});
