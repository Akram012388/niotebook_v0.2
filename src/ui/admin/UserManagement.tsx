"use client";

import { type ReactElement, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";

type UserRow = {
  id: string;
  email?: string;
  role: "admin" | "user" | "guest";
  inviteBatchId?: string;
  createdAt: number;
};

type Role = "admin" | "user" | "guest";

const listAllRef = makeFunctionReference<"query">(
  "users:listAll",
) as FunctionReference<"query", "public", Record<string, never>, UserRow[]>;

const updateRoleRef = makeFunctionReference<"mutation">(
  "users:updateRole",
) as FunctionReference<
  "mutation",
  "public",
  { userId: GenericId<"users">; role: Role },
  { ok: boolean }
>;

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const RoleBadge = ({ role }: { role: string }): ReactElement => {
  const colors: Record<string, string> = {
    admin: "bg-accent-muted text-accent",
    user: "bg-status-info/10 text-status-info",
    guest: "bg-surface-muted text-text-muted",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[role] ?? "bg-surface-muted text-text-muted"}`}
    >
      {role}
    </span>
  );
};

const UserManagement = (): ReactElement => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  const users = useQuery(listAllRef);
  const updateRole = useMutation(updateRoleRef);

  const handleRoleChange = async (
    userId: string,
    role: Role,
  ): Promise<void> => {
    await updateRole({ userId: userId as GenericId<"users">, role });
  };

  const filtered = users
    ?.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (search && !u.email?.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Users</h1>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-text-subtle transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="guest">Guest</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Batch
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Joined
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Change Role
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered === undefined ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0 transition-colors duration-100 hover:bg-surface-muted/50"
                >
                  <td className="px-4 py-2.5 text-foreground">
                    {user.email ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">
                    {user.inviteBatchId ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as Role)
                      }
                      className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="guest">Guest</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { UserManagement };
