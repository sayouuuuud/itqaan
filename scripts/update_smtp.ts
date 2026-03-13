
import { query } from '../lib/db';

async function main() {
    const newConfig = {
        host: "smtp.gmail.com",
        port: 465,
        user: "itqaan69@gmail.com",
        secure: true,
        password: "oznmbncchjcvibrl",
        fromName: "إتقان الفاتحة",
        fromEmail: "itqaan69@gmail.com"
    };

    try {
        await query(
            'UPDATE system_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2',
            [JSON.stringify(newConfig), 'smtp_config']
        );
        console.log('SUCCESS: SMTP configuration updated.');
    } catch (err) {
        console.error('ERROR:', err);
    }
}

main();
