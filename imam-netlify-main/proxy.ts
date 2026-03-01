import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  // Basic proxy function - pass through all requests
  return NextResponse.next()
}

export default proxy
