import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { convertWebMToMP4 } from '../lib/audio-converter';
import { uploadToStorage } from '../lib/storage';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role for updates

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('--- Starting Audio Migration (WebM -> MP4) ---');

  // 1. Fetch all recitations with .webm URLs
  const { data: recitations, error } = await supabase
    .from('recitations')
    .select('id, audio_url')
    .like('audio_url', '%.webm%');

  if (error) {
    console.error('Error fetching recitations:', error);
    return;
  }

  console.log(`Found ${recitations.length} recitations to migrate.`);

  for (const recitation of recitations) {
    try {
      console.log(`\nProcessing Recitation ID: ${recitation.id}`);
      console.log(`Original URL: ${recitation.audio_url}`);

      // 2. Download the WebM file
      const response = await axios.get(recitation.audio_url, { responseType: 'arraybuffer' });
      const webmBuffer = Buffer.from(response.data);

      // 3. Convert to MP4
      console.log('Converting to MP4...');
      const mp4Buffer = await convertWebMToMP4(webmBuffer);

      // 4. Upload to UploadThing
      const fileName = `migrated-${recitation.id}.mp4`;
      console.log(`Uploading as ${fileName}...`);
      const uploadResult = await uploadToStorage(mp4Buffer, fileName, 'audio/mp4');

      // 5. Update Supabase record
      const { error: updateError } = await supabase
        .from('recitations')
        .update({ audio_url: uploadResult.url })
        .eq('id', recitation.id);

      if (updateError) {
        console.error(`Error updating recitation ${recitation.id}:`, updateError);
      } else {
        console.log(`Successfully migrated to: ${uploadResult.url}`);
      }
    } catch (err) {
      console.error(`Failed to migrate recitation ${recitation.id}:`, err);
    }
  }

  console.log('\n--- Migration Finished ---');
}

migrate();
