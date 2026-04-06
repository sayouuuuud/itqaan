import { DashboardShell } from "@/components/dashboard-shell"
import { auth } from "@/lib/better-auth-config"
import { redirect } from "next/navigation"

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: {} as any })

  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    redirect("/login")
  }

  return (
    <DashboardShell role={session.user.role as any}>
      {children}
    </DashboardShell>
  )
}
