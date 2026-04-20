const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function applySchema() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Applying schema...');
        await pool.query(schema);
        console.log('Schema applied successfully.');

        // Add a test superadmin
        const phone = '1234567890';
        const name = 'Super Admin';
        await pool.query(
            'INSERT INTO superadmins (name, phone, role) VALUES ($1, $2, $3) ON CONFLICT (phone) DO NOTHING',
            [name, phone, 'superadmin']
        );
        console.log(`Test SuperAdmin checked/created with phone: ${phone}`);

    } catch (err) {
        console.error('Error applying schema:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

applySchema();
