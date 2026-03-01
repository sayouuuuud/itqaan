'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Don't track admin pages or API routes
        if (pathname?.startsWith('/admin') || pathname?.startsWith('/api')) {
            return;
        }

        // Track page view
        const trackPageView = async () => {
            try {
                // Get visitor ID from localStorage or create new one
                let visitorId = localStorage.getItem('visitor_id');
                if (!visitorId) {
                    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    localStorage.setItem('visitor_id', visitorId);
                }

                // Detect device type
                const deviceType = /mobile/i.test(navigator.userAgent) ? 'mobile' :
                    /tablet/i.test(navigator.userAgent) ? 'tablet' : 'desktop';

                // Get browser and OS info
                const userAgent = navigator.userAgent;
                const browser = getBrowser(userAgent);
                const os = getOS(userAgent);

                // Send analytics data
                await fetch('/api/analytics/page-view', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        page_path: pathname,
                        visitor_id: visitorId,
                        device_type: deviceType,
                        browser,
                        os,
                        user_agent: userAgent,
                        referrer: document.referrer || null,
                    }),
                });
            } catch (error) {
                // Silently fail - don't break the page
                console.error('Analytics tracking failed:', error);
            }
        };

        trackPageView();
    }, [pathname]);

    return null;
}

function getBrowser(userAgent: string): string {
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Other';
}

function getOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Other';
}
