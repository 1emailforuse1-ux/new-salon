const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET /api/admins
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM admins ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admins/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM admins WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admins - Create admin
router.post('/', async (req, res) => {
    const { name, phone, shopId, permissions } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });
    const id = 'user_' + Date.now();
    try {
        const result = await pool.query(
            `INSERT INTO admins (id, name, phone, role, shop_id, admin_id, permissions)
             VALUES ($1, $2, $3, 'admin', $4, $5, $6) RETURNING *`,
            [id, name, phone, shopId || null, id, JSON.stringify(permissions || [])]
        );
        const admin = result.rows[0];
        const io = req.app.get('io');
        io.to('admins').emit('admins:change', { type: 'added', admin });
        res.status(201).json(admin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admins/:id - Update admin
router.put('/:id', async (req, res) => {
    const { name, phone, shopId, permissions } = req.body;
    try {
        const result = await pool.query(
            `UPDATE admins SET name=$1, phone=$2, shop_id=$3, permissions=$4, updated_at=NOW()
             WHERE id=$5 RETURNING *`,
            [name, phone, shopId || null, JSON.stringify(permissions || []), req.params.id]
        );
        const admin = result.rows[0];
        const io = req.app.get('io');
        io.to('admins').emit('admins:change', { type: 'modified', admin });
        
        // Notify the specific admin about permission change
        io.emit('admin-permissions-updated', { adminId: req.params.id, permissions: permissions });
        
        res.json(admin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admins/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM admins WHERE id = $1', [req.params.id]);
        const io = req.app.get('io');
        io.to('admins').emit('admins:change', { type: 'deleted', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
