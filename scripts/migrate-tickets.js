require('dotenv').config({ path: 'd:\\iqraa\\.env.local' });
const { Pool } = require('pg');

async function migrate() {
    console.log("Starting migration...");
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await pool.query(`
            ALTER TABLE conversations 
            ADD COLUMN IF NOT EXISTS is_ticket BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS ticket_status TEXT DEFAULT 'open';
        `);
        console.log("Migration successful: Added is_ticket and ticket_status");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}
migrate();
