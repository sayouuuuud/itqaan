
import { query } from '../lib/db';

async function main() {
    try {
        console.log('--- TABLE: page_views ---');
        const columns = await query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'page_views'
        `);
        console.log(JSON.stringify(columns, null, 2));
    } catch (err) {
        console.error('ERROR:', err);
    }
}

main();
