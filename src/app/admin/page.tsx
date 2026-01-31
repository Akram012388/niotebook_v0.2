"use client";

import type { ReactElement } from "react";

export default function AdminDashboardPage(): ReactElement {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-2 text-sm text-muted">
        Welcome to the admin console. Use the sidebar to navigate.
      </p>
    </div>
  );
}
