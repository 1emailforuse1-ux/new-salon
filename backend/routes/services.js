const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/services?role=&shopId=&adminId=
router.get('/', async (req, res) => {
    const { role, shopId, adminId } = req.query;
    try {
        let query = 'SELECT * FROM services';
        const params = [];
        const conditions = [];
        if (role !== 'superadmin') {
            if (shopId) {
                conditions.push(`(shop_id = $${params.length + 1} OR shop_id IS NULL)`);
                params.push(shopId);
            } else if (adminId) {
                conditions.push(`(admin_id = $${params.length + 1} OR shop_id IS NULL)`);
                params.push(adminId);
            }
        }
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/services
router.post('/', async (req, res) => {
    const { name, category, duration, price, adminId, adminName, shopId, shopName } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    try {
        const result = await pool.query(
            `INSERT INTO services (name, category, duration, price, admin_id, admin_name, shop_id, shop_name)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [name, category, parseInt(duration) || 30, parseFloat(price) || 0,
             adminId || 'System', adminName || 'Admin', shopId || null, shopName || 'Global']
        );
        const svc = result.rows[0];
        const io = req.app.get('io');
        io.to('services').emit('services:change', { type: 'added', service: svc });
        res.status(201).json(svc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
    const { name, category, duration, price, shopId, shopName } = req.body;
    try {
        const result = await pool.query(
            `UPDATE services SET name=$1, category=$2, duration=$3, price=$4,
             shop_id=$5, shop_name=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
            [name, category, parseInt(duration) || 30, parseFloat(price) || 0,
             shopId || null, shopName || 'Global', req.params.id]
        );
        const svc = result.rows[0];
        const io = req.app.get('io');
        io.to('services').emit('services:change', { type: 'modified', service: svc });
        res.json(svc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM services WHERE id = $1', [req.params.id]);
        const io = req.app.get('io');
        io.to('services').emit('services:change', { type: 'deleted', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
