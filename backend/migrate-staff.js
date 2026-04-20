const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Adding permissions column to staff table...');
        await pool.query("ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';");
        console.log('Successfully added permissions column to staff table.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
