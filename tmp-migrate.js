const { query } = require("./lib/db");
async function migrate() {
  try {
    await query("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_supervisor_id UUID REFERENCES users(id)");
    console.log("Migration successful");
  } catch (e) {
    console.error(e);
  }
}
migrate();
