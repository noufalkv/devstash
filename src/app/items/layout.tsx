import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
