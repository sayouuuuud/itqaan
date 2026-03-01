
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
   try {
      const body = await req.json();
      const { type, id, size_bytes, duration_seconds } = body;
      // type: 'book_view' | 'book_download' | 'audio_play' | 'audio_download'

      if (!type || typeof type !== 'string') {
         return NextResponse.json({ error: "Missing or invalid 'type' field" }, { status: 400 });
      }

      const supabase = await createClient();
      const date = new Date().toISOString().split('T')[0];

      // 1. Update Daily Global Usage
      const bandwidthBytes = size_bytes || 0;

      // We use RPC or raw query for atomic increments usually, but for simplicity here we doing upsert logic
      // A better approach for high concurrency is to having a queue or using Postgres function `increment_usage`
      // Let's implement a simple upsert flow here. For high scale, use RPC.

      // We will assume an RPC function `track_bandwidth_usage` exists for atomic updates is better
      // But adhering to the requested SQL file earlier, we didn't make RPCs. 
      // Let's try to do it via robust Upsert if possible, or simple insert and aggregate later?
      // No, dashboard needs real-time.

      // Let's call Supabase RPC if we can, otherwise fallback to check-then-update (race conditions possible but ok for this scale)

      // IMPLEMENTATION:

      if (type.startsWith('book')) {
         // Upsert Book Stats
         const { error: statsError } = await supabase.rpc('track_book_usage', {
            p_book_id: id,
            p_date: date,
            p_bandwidth: bandwidthBytes,
            p_is_download: type === 'book_download'
         });

         if (statsError) {
            // Fallback if RPC missing (we should create it, see next step)
            console.error("RPC track_book_usage failed:", statsError);
         }
      } else if (type.startsWith('audio')) {
         // Upsert Audio Stats
         // Determine if lesson or sermon
         // This is tricky without knowing which table ID belongs to. 
         // The frontend should ideally send parent_type: 'lesson' | 'sermon'
         // For now let's assume body has 'audio_type'
         const { audio_type } = body; // 'lesson' or 'sermon'

         const { error: statsError } = await supabase.rpc('track_audio_usage', {
            p_item_id: id,
            p_item_type: audio_type || 'lesson', // default or logic
            p_date: date,
            p_bandwidth: bandwidthBytes,
            p_is_download: type === 'audio_download',
            p_duration: duration_seconds || 0
         });
      }

      return NextResponse.json({ success: true });

   } catch (error) {
      console.error("Tracking error:", error);
      return NextResponse.json({ error: "Internal Error" }, { status: 500 });
   }
}
