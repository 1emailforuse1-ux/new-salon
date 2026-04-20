const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET /api/shops - All shops
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM shops ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/shops - Create shop
router.post('/', async (req, res) => {
    const { shopName, adminId } = req.body;
    if (!shopName) return res.status(400).json({ error: 'shopName required' });
    const id = 'shop_' + uuidv4().replace(/-/g, '').substring(0, 16);
    try {
        const result = await pool.query(
            'INSERT INTO shops (id, shop_name, admin_id) VALUES ($1, $2, $3) RETURNING *',
            [id, shopName, adminId || null]
        );
        const shop = result.rows[0];

        // If admin assigned, update their shop_id
        if (adminId) {
            await pool.query('UPDATE admins SET shop_id = $1 WHERE id = $2', [shop.id, adminId]);
        }

        const io = req.app.get('io');
        io.to('shops').emit('shops:change', { type: 'added', shop });

        res.status(201).json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/shops/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM shops WHERE id = $1', [req.params.id]);
        const io = req.app.get('io');
        io.to('shops').emit('shops:change', { type: 'deleted', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
