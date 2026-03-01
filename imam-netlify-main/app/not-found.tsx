import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>

        <h1 className="text-3xl font-bold text-foreground mb-4 font-serif">
          الصفحة غير موجودة
        </h1>

        <p className="text-muted mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="bg-primary hover:bg-primary-hover text-white w-full sm:w-auto">
              <Home className="h-4 w-4 ml-2" />
              الرئيسية
            </Button>
          </Link>

          <Link href="/search">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <Search className="h-4 w-4 ml-2" />
              البحث
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
