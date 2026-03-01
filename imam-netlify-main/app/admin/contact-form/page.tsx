import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import ContactFormContent from "./contact-form-content"

export default function ContactFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ContactFormContent />
    </Suspense>
  )
}