import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  
  const allowedRoles = ['admin', 'student_supervisor', 'reciter_supervisor']
  
  if (!session || !allowedRoles.includes(session.role)) {
    redirect('/login-admin')
  }

  return <DashboardShell role={session.role as any}>{children}</DashboardShell>
}
