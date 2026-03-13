
import { queryOne } from '../lib/db';

async function main() {
    try {
        const row = await queryOne('SELECT setting_value FROM system_settings WHERE setting_key = $1', ['smtp_config']);
        console.log('CURRENT_CONFIG:', JSON.stringify(row?.setting_value));
    } catch (err) {
        console.error('ERROR:', err);
    }
}

main();
