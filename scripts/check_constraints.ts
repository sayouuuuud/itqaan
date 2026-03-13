
import { query } from '../lib/db';

async function main() {
    try {
        console.log('--- CONSTRAINTS: page_views ---');
        const constraints = await query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'page_views'::regclass
        `);
        console.log(JSON.stringify(constraints, null, 2));
    } catch (err) {
        console.error('ERROR:', err);
    }
}

main();
