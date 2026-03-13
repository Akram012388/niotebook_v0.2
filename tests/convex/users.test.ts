import { describe, it, expect } from "vitest";
import { makeTestEnv, api } from "./setup";

const TOKEN = "https://convex.test|user-users-test";
const ADMIN_TOKEN = "https://convex.test|admin-users-test";

describe("users — upsertUser", () => {
  it("creates a new user and returns userId + role", async () => {
    const t = makeTestEnv();

    const result = await t
      .withIdentity({ tokenIdentifier: TOKEN })
      .mutation(api.users.upsertUser, {});

    expect(result.userId).toBeTruthy();
    expect(result.role).toBe("user");
  });

  it("is idempotent — returns the same userId on repeat calls", async () => {
    const t = makeTestEnv();
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN });

    const first = await tWithId.mutation(api.users.upsertUser, {});
    const second = await tWithId.mutation(api.users.upsertUser, {});

    expect(first.userId).toBe(second.userId);
  });

  it("throws when called without identity", async () => {
    const t = makeTestEnv();

    await expect(t.mutation(api.users.upsertUser, {})).rejects.toThrow(
      "Not authenticated.",
    );
  });
});

describe("users — me", () => {
  it("returns role for an authenticated user", async () => {
    const t = makeTestEnv();
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN });

    // First create the user
    await tWithId.mutation(api.users.upsertUser, {});

    const result = await tWithId.query(api.users.me, {});

    expect(result).toEqual({ role: "user" });
  });

  it("returns null when no identity is provided", async () => {
    const t = makeTestEnv();

    const result = await t.query(api.users.me, {});

    expect(result).toBeNull();
  });

  it("returns null for authenticated user not in DB", async () => {
    const t = makeTestEnv();
    // Don't seed any users — just provide identity
    const result = await t
      .withIdentity({ tokenIdentifier: "https://convex.test|unknown-user" })
      .query(api.users.me, {});
    expect(result).toBeNull();
  });
});

describe("users — listAll", () => {
  it("throws for a regular user", async () => {
    const t = makeTestEnv();

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: TOKEN,
        role: "user",
      });
    });

    await expect(
      t.withIdentity({ tokenIdentifier: TOKEN }).query(api.users.listAll, {}),
    ).rejects.toThrow("Admin access required.");
  });

  it("returns all users for an admin", async () => {
    const t = makeTestEnv();

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: ADMIN_TOKEN,
        email: "admin@test.com",
        role: "admin",
      });
      await ctx.db.insert("users", {
        tokenIdentifier: TOKEN,
        email: "user@test.com",
        role: "user",
      });
    });

    const users = await t
      .withIdentity({ tokenIdentifier: ADMIN_TOKEN })
      .query(api.users.listAll, {});

    expect(users).toHaveLength(2);
    expect(users.map((u) => u.role).sort()).toEqual(["admin", "user"]);
  });
});

describe("users — updateRole", () => {
  it("changes user role when called by admin", async () => {
    const t = makeTestEnv();

    const { targetUserId } = await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: ADMIN_TOKEN,
        role: "admin",
      });
      const targetId = await ctx.db.insert("users", {
        tokenIdentifier: TOKEN,
        role: "user",
      });
      return { targetUserId: targetId };
    });

    const result = await t
      .withIdentity({ tokenIdentifier: ADMIN_TOKEN })
      .mutation(api.users.updateRole, {
        userId: targetUserId,
        role: "admin",
      });

    expect(result).toEqual({ ok: true });

    // Verify the role was actually changed
    const users = await t
      .withIdentity({ tokenIdentifier: ADMIN_TOKEN })
      .query(api.users.listAll, {});

    const target = users.find((u) => u.id === (targetUserId as string));
    expect(target?.role).toBe("admin");
  });

  it("returns { ok: false } for a non-existent user", async () => {
    const t = makeTestEnv();

    const { fakeUserId } = await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: ADMIN_TOKEN,
        role: "admin",
      });
      // Insert and immediately delete to get a valid-shaped but non-existent ID
      const tempId = await ctx.db.insert("users", {
        tokenIdentifier: "temp",
        role: "user",
      });
      await ctx.db.delete(tempId);
      return { fakeUserId: tempId };
    });

    const result = await t
      .withIdentity({ tokenIdentifier: ADMIN_TOKEN })
      .mutation(api.users.updateRole, {
        userId: fakeUserId,
        role: "admin",
      });

    expect(result).toEqual({ ok: false });
  });
});
