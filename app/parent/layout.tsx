import { DashboardShell } from "@/components/dashboard-shell"
import { auth } from "@/lib/better-auth-config"
import { redirect } from "next/navigation"

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: {} as any })

  if (!session || session.user.role !== "PARENT") {
    redirect("/login")
  }

  return (
    <DashboardShell role={session.user.role as any}>
      {children}
    </DashboardShell>
  )
}
