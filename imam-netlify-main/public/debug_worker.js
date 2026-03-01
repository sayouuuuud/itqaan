// Simple debug worker for testing Web Worker functionality
self.onmessage = function(e) {
    console.log('Debug Worker received:', e.data);

    // Simulate some work
    setTimeout(() => {
        self.postMessage({
            type: 'debug_response',
            message: 'Web Worker is working correctly!',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        });
    }, 100);
};

self.onerror = function(error) {
    console.error('Debug Worker error:', error);
    self.postMessage({
        type: 'error',
        message: 'Worker encountered an error',
        error: error.message
    });
};

console.log('Debug Worker loaded successfully');
