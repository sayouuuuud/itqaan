import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>

        <h1 className="text-3xl font-bold text-foreground mb-4 font-serif">
          صفحة غير موجودة
        </h1>

        <p className="text-muted mb-8">
          عذراً، الصفحة المطلوبة في لوحة التحكم غير موجودة.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin">
            <Button className="bg-primary hover:bg-primary-hover text-white w-full sm:w-auto">
              <Home className="h-4 w-4 ml-2" />
              لوحة التحكم
            </Button>
          </Link>

          <Link href="/admin">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <Search className="h-4 w-4 ml-2" />
              البحث في الإدارة
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

