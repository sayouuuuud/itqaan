import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            page_path,
            visitor_id,
            device_type,
            browser,
            os,
            user_agent,
            referrer,
        } = body;

        // Validate required fields
        if (!page_path || !visitor_id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get country from request headers (Netlify/Vercel provide this)
        const country = req.headers.get('x-vercel-ip-country') ||
            req.headers.get('x-country') ||
            'Unknown';

        const city = req.headers.get('x-vercel-ip-city') ||
            req.headers.get('x-city') ||
            null;

        // Insert page view into analytics_visits table
        const { error } = await supabase
            .from('analytics_visits')
            .insert({
                page_path,
                visitor_id,
                country,
                city,
                device_type: device_type || 'desktop',
                browser,
                os,
                user_agent,
                referrer,
            });

        if (error) {
            console.error('Error inserting analytics:', error);
            return NextResponse.json(
                { error: 'Failed to track page view' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
