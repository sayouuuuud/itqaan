export class TimeoutError extends Error {
  constructor(message = "Operation timed out") {
    super(message)
    this.name = "TimeoutError"
  }
}

/**
 * Wrap a promise with a timeout. Useful to prevent long DB calls
 * from hanging SSR and causing 500 timeouts.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message?: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new TimeoutError(message)), ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
