// Mock PDF Debug Worker for testing PDF.js Worker loading
self.onmessage = function(e) {
    console.log('PDF Debug Worker received:', e.data);

    // Simulate PDF worker functionality
    if (e.data && e.data.cmd === 'test') {
        self.postMessage({
            type: 'pdf_worker_response',
            message: 'PDF Worker simulation successful',
            timestamp: new Date().toISOString(),
            workerType: 'mock_debug_worker',
            isLocalWorker: true,
            sameOrigin: self.location.origin === window.location.origin
        });
    } else {
        self.postMessage({
            type: 'unknown_command',
            message: 'Unknown command received',
            received: e.data
        });
    }
};

self.onerror = function(error) {
    console.error('PDF Debug Worker error:', error);
    self.postMessage({
        type: 'error',
        message: 'PDF Worker encountered an error',
        error: error.message,
        stack: error.stack
    });
};

console.log('PDF Debug Worker loaded successfully');
