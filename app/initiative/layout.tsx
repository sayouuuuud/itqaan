import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function InitiativeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  const allowedRoles = ['initiative_admin', 'admin']
  if (!session || !allowedRoles.includes(session.role)) {
    redirect('/login-admin')
  }

  return <DashboardShell role="initiative_admin">{children}</DashboardShell>
}
