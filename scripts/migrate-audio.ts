/**
 * migrate-audio.ts
 * Migration script to transcode legacy WebM and Cloudinary audio files to MP4/UploadThing
 */

import { createClient } from '@supabase/supabase-js';
import { convertWebMToMP4 } from '../lib/audio-converter';
import { uploadToStorage } from '../lib/storage';
import * as dotenv from 'dotenv';
import axios from 'axios';
import dns from 'dns';

// Fix for Node 18+ DNS resolution issues
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function migrate() {
  console.log('--- Starting Audio Migration (WebM -> MP4) ---');
  
  try {
    // 1. Fetch all recitations with .webm or cloudinary URLs
    console.log('Fetching recitations from Supabase...');
    const { data: recitations, error } = await supabase
      .from('recitations')
      .select('id, audio_url')
      .or('audio_url.ilike.%.webm%,audio_url.ilike.%cloudinary%');
    
    if (error) throw error;
    
    console.log(`Found ${recitations.length} recitations to migrate.`);

    for (const row of recitations) {
      const { id, audio_url } = row;
      console.log(`\nMigrating Recitation [${id}]: ${audio_url}`);

      try {
        // 2. Download original file
        console.log(`Downloading file...`);
        const response = await axios.get(audio_url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // 3. Transcode to MP4
        console.log(`Transcoding to MP4...`);
        const mp4Buffer = await convertWebMToMP4(buffer);

        // 4. Upload to Storage (UploadThing)
        const fileName = `migrated_${id}.mp4`;
        console.log(`Uploading to storage as ${fileName}...`);
        const result = await uploadToStorage(mp4Buffer, fileName, 'audio/mp4');

        // 5. Update Database
        console.log(`Updating database with new URL: ${result.url}`);
        const { error: updateError } = await supabase
          .from('recitations')
          .update({ audio_url: result.url })
          .eq('id', id);

        if (updateError) throw updateError;

        console.log(`✅ Success for [${id}]`);

        // Avoid hitting rate limits or overhead
        await new Promise(r => setTimeout(r, 500));
        
      } catch (fileError: any) {
        console.error(`❌ Failed migrating [${id}]:`, fileError.message);
      }
    }

    console.log('\n--- Migration Finished ---');
  } catch (err) {
    console.error('Migration Error:', err);
  }
}

migrate();

migrate();
