const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/inventory?adminId=
router.get('/', async (req, res) => {
    const { role, shopId, adminId } = req.query;
    try {
        let query = 'SELECT * FROM inventory';
        const params = [];
        const conditions = [];
        if (role !== 'superadmin') {
            if (shopId) { conditions.push(`shop_id = $${params.length + 1}`); params.push(shopId); }
            else if (adminId) { conditions.push(`admin_id = $${params.length + 1}`); params.push(adminId); }
        }
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/inventory
router.post('/', async (req, res) => {
    const { name, category, stock, price, adminId, shopId } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    try {
        const result = await pool.query(
            `INSERT INTO inventory (name, category, stock, price, admin_id, shop_id)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [name, category || null, parseInt(stock) || 0, parseFloat(price) || 0,
             adminId || null, shopId || null]
        );
        const item = result.rows[0];
        const io = req.app.get('io');
        io.to('inventory').emit('inventory:change', { type: 'added', item });
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
        const io = req.app.get('io');
        io.to('inventory').emit('inventory:change', { type: 'deleted', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
