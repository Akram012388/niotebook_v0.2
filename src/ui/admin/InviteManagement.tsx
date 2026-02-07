"use client";

import { type ReactElement, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";

type InviteRow = {
  id: string;
  code: string;
  status: string;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
  usedByUserId?: string;
  inviteBatchId: string;
  role: string;
};

type StatusFilter = "active" | "used" | "expired" | undefined;

const listAllRef = makeFunctionReference<"query">(
  "invites:listAll",
) as FunctionReference<
  "query",
  "public",
  { status?: "active" | "used" | "expired" },
  InviteRow[]
>;

const generateRef = makeFunctionReference<"mutation">(
  "invites:generate",
) as FunctionReference<
  "mutation",
  "public",
  { count: number; inviteBatchId: string; role?: "user" | "admin" },
  string[]
>;

const revokeRef = makeFunctionReference<"mutation">(
  "invites:revoke",
) as FunctionReference<
  "mutation",
  "public",
  { inviteId: GenericId<"invites"> },
  { ok: boolean }
>;

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const StatusBadge = ({ status }: { status: string }): ReactElement => {
  const colors: Record<string, string> = {
    active: "bg-status-success/10 text-status-success",
    used: "bg-status-info/10 text-status-info",
    expired: "bg-status-error/10 text-status-error",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-surface-muted text-text-muted"}`}
    >
      {status}
    </span>
  );
};

const InviteManagement = (): ReactElement => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [batchId, setBatchId] = useState("");
  const [count, setCount] = useState(5);
  const [role, setRole] = useState<"user" | "admin">("user");
  const [generating, setGenerating] = useState(false);

  const invites = useQuery(
    listAllRef,
    statusFilter ? { status: statusFilter } : {},
  );
  const generateMut = useMutation(generateRef);
  const revokeMut = useMutation(revokeRef);

  const handleGenerate = async (): Promise<void> => {
    if (!batchId.trim()) return;
    setGenerating(true);
    try {
      await generateMut({ count, inviteBatchId: batchId.trim(), role });
      setBatchId("");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (inviteId: string): Promise<void> => {
    await revokeMut({ inviteId: inviteId as GenericId<"invites"> });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Invites</h1>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter ?? "all"}
            onChange={(e) =>
              setStatusFilter(
                e.target.value === "all"
                  ? undefined
                  : (e.target.value as StatusFilter),
              )
            }
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Generate Invites form */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-xs font-semibold font-mono uppercase tracking-[0.15em] text-accent">
          Generate Invites
        </h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Batch ID
            </label>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="e.g. alpha-jan-2026"
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-text-subtle transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Count
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              min={1}
              max={50}
              className="w-20 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "user" | "admin")}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !batchId.trim()}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Invites table */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Batch
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Expires
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                Used By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted" />
            </tr>
          </thead>
          <tbody>
            {invites === undefined ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  Loading...
                </td>
              </tr>
            ) : invites.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  No invites found.
                </td>
              </tr>
            ) : (
              invites.map((invite) => (
                <tr
                  key={invite.id}
                  className="border-b border-border last:border-0 transition-colors duration-100 hover:bg-surface-muted/50"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                    {invite.code}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={invite.status} />
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{invite.role}</td>
                  <td className="px-4 py-2.5 text-text-muted">
                    {invite.inviteBatchId}
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">
                    {formatDate(invite.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">
                    {formatDate(invite.expiresAt)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                    {invite.usedByUserId ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {invite.status === "active" && (
                      <button
                        onClick={() => handleRevoke(invite.id)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-status-error transition-colors duration-150 hover:bg-status-error/10"
                      >
                        Revoke
                      </button>
                    )}
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

export { InviteManagement };
