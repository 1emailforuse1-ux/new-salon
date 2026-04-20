const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/superadmins
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM superadmins ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/superadmins
router.post('/', async (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });
    try {
        const result = await pool.query(
            `INSERT INTO superadmins (name, phone, role) VALUES ($1, $2, 'superadmin') RETURNING *`,
            [name, phone]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/superadmins/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM superadmins WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
