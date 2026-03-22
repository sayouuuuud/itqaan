import axios from 'axios';
import dns from 'dns';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config({ path: '.env.local' });

async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }

  console.log('Testing connectivity to:', url);

  try {
    console.log('1. Trying simple axios fetch...');
    const res = await axios.get(`${url}/rest/v1/recitations?select=count`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log('✅ Axios Success:', res.data);
  } catch (err: any) {
    console.error('❌ Axios Failed:', err.message);
    if (err.code) console.error('Error Code:', err.code);
  }

  try {
    console.log('\n2. Trying Supabase Client...');
    const supabase = createClient(url, key);
    const { count, error } = await supabase
      .from('recitations')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log('✅ Supabase Client Success, count:', count);
  } catch (err: any) {
    console.error('❌ Supabase Client Failed:', err.message);
  }
}

test();
