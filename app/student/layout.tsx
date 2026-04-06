import { DashboardShell } from '@/components/dashboard-shell'
import { auth } from '@/lib/better-auth-config'
import { redirect } from 'next/navigation'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: {} as any })
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  return <DashboardShell role="student">{children}</DashboardShell>
}

