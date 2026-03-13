
import { query } from '../lib/db';

async function main() {
    try {
        console.log('Expanding device_type column length...');
        await query(`ALTER TABLE page_views ALTER COLUMN device_type TYPE VARCHAR(255)`);
        console.log('SUCCESS: Column device_type expanded successfully.');
    } catch (err) {
        console.error('ERROR:', err);
    }
}

main();
