const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/auth/check - Find user by phone across all tables
router.post('/check', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    try {
        // Check superadmins first
        let result = await pool.query(
            'SELECT id, name, phone, role, NULL AS shop_id, NULL AS admin_id, \'[]\'::jsonb AS permissions FROM superadmins WHERE phone = $1',
            [phone]
        );
        if (result.rows.length > 0) {
            const u = result.rows[0];
            return res.json({ found: true, user: { ...u, role: 'superadmin', adminId: u.id } });
        }

        // Check admins
        result = await pool.query(
            'SELECT id, name, phone, role, shop_id, admin_id, permissions FROM admins WHERE phone = $1',
            [phone]
        );
        if (result.rows.length > 0) {
            const u = result.rows[0];
            return res.json({ found: true, user: { ...u, adminId: u.admin_id || u.id } });
        }

        // Check staff
        result = await pool.query(
            'SELECT id, name, phone, role, shop_id, admin_id, permissions FROM staff WHERE phone = $1',
            [phone]
        );
        if (result.rows.length > 0) {
            const u = result.rows[0];
            return res.json({ found: true, user: { ...u, role: u.role || 'employee', adminId: u.admin_id } });
        }

        // Check users table (fallback)
        result = await pool.query(
            'SELECT id, name, phone, role, shop_id, admin_id FROM users WHERE phone = $1',
            [phone]
        );
        if (result.rows.length > 0) {
            const u = result.rows[0];
            return res.json({ found: true, user: { ...u, adminId: u.admin_id } });
        }

        return res.json({ found: false });
    } catch (err) {
        console.error('[AUTH] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
