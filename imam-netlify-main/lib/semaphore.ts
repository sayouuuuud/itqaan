/**
 * Simple Semaphore implementation to limit concurrent operations.
 * Useful for restricting resource-intensive tasks like PDF generation or large downloads.
 */
export class Semaphore {
    private permits: number;
    private queue: Array<(release: () => void) => void> = [];

    /**
     * @param maxConcurrency Maximum number of concurrent operations allowed.
     */
    constructor(maxConcurrency: number = 1) {
        this.permits = maxConcurrency;
    }

    /**
     * Acquire a permit. If no permits are available, the promise resolves
     * when a permit becomes available (FIFO).
     * @returns A function that must be called to release the permit.
     */
    async acquire(): Promise<() => void> {
        if (this.permits > 0) {
            this.permits--;
            return Promise.resolve(() => this.release());
        }

        // Wait in queue
        return new Promise<() => void>((resolve) => {
            this.queue.push(resolve);
        }).then(() => {
            return () => this.release();
        });
    }

    private release() {
        if (this.queue.length > 0) {
            // Give permit to the next waiter
            const nextResolver = this.queue.shift();
            if (nextResolver) {
                // Resolve the waiter with the release function
                nextResolver(() => this.release());
            }
        } else {
            this.permits++;
        }
    }

    /**
     * Get current number of available permits.
     */
    getAvailablePermits(): number {
        return this.permits;
    }

    /**
     * Get current queue length.
     */
    getQueueLength(): number {
        return this.queue.length;
    }
}

// Global instance specifically for PDF downloads/generation
// We use a global variable to ensure it persists across hot-reloads in dev
// and is shared in the module scope in production.
const globalForSemaphore = globalThis as unknown as { pdfSemaphore: Semaphore };

export const pdfSemaphore = globalForSemaphore.pdfSemaphore || new Semaphore(2);

if (process.env.NODE_ENV !== "production") {
    globalForSemaphore.pdfSemaphore = pdfSemaphore;
}
