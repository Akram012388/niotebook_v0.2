import type { ReactElement, ReactNode } from "react";
import { AuthGate } from "@/ui/auth/AuthGate";
import { AdminGuard } from "@/ui/admin/AdminGuard";
import { AdminLayout } from "@/ui/admin/AdminLayout";

type AdminRouteLayoutProps = {
  children: ReactNode;
};

export default function AdminRouteLayout({
  children,
}: AdminRouteLayoutProps): ReactElement {
  return (
    <AuthGate>
      <AdminGuard>
        <AdminLayout>{children}</AdminLayout>
      </AdminGuard>
    </AuthGate>
  );
}
