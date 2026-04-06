import { auth } from "@/lib/better-auth-config"

export const { GET, POST } = auth.toNextJsHandler()
