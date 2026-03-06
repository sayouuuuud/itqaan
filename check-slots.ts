// check-slots.ts
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT u.id, u.name, s.day_of_week, s.start_time, s.end_time, s.specific_date, s.is_recurring
            FROM availability_slots s
            JOIN users u ON s.reader_id = u.id
            WHERE u.role = 'reader'
            ORDER BY u.name, s.day_of_week, s.specific_date NULLS FIRST, s.start_time
        `);
        console.log("Reader Slots:", JSON.stringify(res.rows, null, 2));
    } finally {
        client.release();
        await pool.end();
    }
}
main();
