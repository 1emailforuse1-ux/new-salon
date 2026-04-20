const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/invoices?role=&shopId=&adminId=
router.get('/', async (req, res) => {
    const { role, shopId, adminId } = req.query;
    try {
        let query = 'SELECT * FROM invoices';
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

// GET /api/invoices/by-shop/:shopId - Filter by shop
router.get('/by-shop/:shopId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM invoices WHERE shop_id = $1 ORDER BY created_at DESC',
            [req.params.shopId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/invoices
router.post('/', async (req, res) => {
    const { customerName, customerId, serviceName, total, date, paymentMethod, adminId, shopId, shopName } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO invoices (customer_name, customer_id, service_name, total, date, payment_method, admin_id, shop_id, shop_name)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [customerName, customerId || null, serviceName, parseFloat(total) || 0,
             date || new Date().toISOString().split('T')[0],
             paymentMethod || 'Cash', adminId || 'Global', shopId || null, shopName || 'Global']
        );
        const invoice = result.rows[0];
        const io = req.app.get('io');
        io.to('invoices').emit('invoices:change', { type: 'added', invoice });
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
        const io = req.app.get('io');
        io.to('invoices').emit('invoices:change', { type: 'deleted', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
