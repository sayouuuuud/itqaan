
import { query } from '../lib/db';

async function main() {
    try {
        console.log('--- TABLE: users ---');
        const users = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log(JSON.stringify(users, null, 2));

        console.log('\n--- TABLE: certificate_data ---');
        const certs = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'certificate_data'
        `);
        console.log(JSON.stringify(certs, null, 2));

        console.log('\n--- TABLE: recitations ---');
        const recs = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'recitations'
        `);
        console.log(JSON.stringify(recs, null, 2));
    } catch (err) {
        console.error('ERROR:', err);
    }
}

main();
