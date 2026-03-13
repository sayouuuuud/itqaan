
import { query } from '../lib/db';

async function main() {
    try {
        console.log('Adding missing columns to DB...');
        // Add is_banned if it doesn't exist
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`);
        
        // Add issued_at to certificate_data if it doesn't exist
        await query(`ALTER TABLE certificate_data ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE`);
        
        // Migrate existing certificate data to set issued_at = updated_at for issued certs
        await query(`UPDATE certificate_data SET issued_at = updated_at WHERE certificate_issued = true AND issued_at IS NULL`);

        console.log('SUCCESS: Migration completed.');
    } catch (err) {
        console.error('ERROR:', err);
    }
}

main();
