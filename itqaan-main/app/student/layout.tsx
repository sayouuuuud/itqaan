import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    redirect('/login')
  }

  return <DashboardShell role="student">{children}</DashboardShell>
}

