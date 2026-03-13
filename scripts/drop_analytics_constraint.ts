
import { query } from '../lib/db';

async function main() {
    try {
        console.log('Dropping page_views_device_type_check constraint...');
        await query(`ALTER TABLE page_views DROP CONSTRAINT IF EXISTS page_views_device_type_check`);
        console.log('SUCCESS: Constraint dropped successfully.');
    } catch (err) {
        console.error('ERROR:', err);
    }
}

main();
