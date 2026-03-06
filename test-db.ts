import { query } from "./lib/db"

async function test() {
    console.log("Testing DB query...")
    try {
        const pool = (await import("./lib/db")).default
        if (!pool) return console.log("No pool")

        const client = await pool.connect()
        try {
            const readerRes = await client.query(`SELECT id FROM users WHERE role = 'reader' LIMIT 1`)
            if (readerRes.rows.length === 0) return console.log("No reader found")
            const readerId = readerRes.rows[0].id

            const res = await client.query(
                `INSERT INTO availability_slots (reader_id, day_of_week, start_time, end_time, is_available, is_recurring)
                 VALUES ($1, $2, $3, $4, true, true)
                 RETURNING *`,
                [readerId, 1, "09:00", "09:30"]
            )
            console.log("Success:", res.rows)

            // Cleanup
            await client.query(`DELETE FROM availability_slots WHERE id = $1`, [res.rows[0].id])
        } catch (e: any) {
            console.error("Query Error:", e.message, e.detail, e.constraint)
        } finally {
            client.release()
        }
    } catch (e: any) {
        console.error("Connection Error:", e.message)
    }
}

test().then(() => process.exit(0))
