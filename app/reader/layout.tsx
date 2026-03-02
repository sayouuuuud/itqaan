import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'reader') {
    redirect('/login')
  }

  return <DashboardShell role="reader">{children}</DashboardShell>
}
