import { getSession } from "@/lib/auth"
import { PublicNavbar } from "@/components/public-navbar"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const user = session ? { role: session.role } : null

  return (
    <>
      <PublicNavbar initialUser={user} />
      {children}
    </>
  )
}
