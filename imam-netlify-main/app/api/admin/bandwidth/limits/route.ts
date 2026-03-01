
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('bandwidth_limits').select('*').single();
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const supabase = await createClient();
        
        // Basic validation could go here
        
        // Upsert logic (since we expect single row)
        // First check if row exists
        const { data: existing } = await supabase.from('bandwidth_limits').select('id').single();
        
        let result;
        if (existing) {
             result = await supabase
                .from('bandwidth_limits')
                .update(body)
                .eq('id', existing.id)
                .select()
                .single();
        } else {
             result = await supabase
                .from('bandwidth_limits')
                .insert(body)
                .select()
                .single();
        }

        if (result.error) {
            return NextResponse.json({ error: result.error.message }, { status: 400 });
        }

        return NextResponse.json(result.data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
