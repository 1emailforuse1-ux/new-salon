const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/customers?role=&shopId=&adminId=
router.get('/', async (req, res) => {
    const { role, shopId, adminId } = req.query;
    try {
        let query = 'SELECT * FROM customers';
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

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/customers - Create
router.post('/', async (req, res) => {
    const { name, phone, gender, lastServices, lastPaymentMethod, totalSpent, adminId, shopId, shopName } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });
    try {
        const result = await pool.query(
            `INSERT INTO customers (name, phone, gender, last_services, last_payment_method, total_spent, admin_id, shop_id, shop_name)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [name, phone, gender || null, lastServices || null, lastPaymentMethod || null,
             parseFloat(totalSpent) || 0, adminId || 'Global', shopId || null, shopName || 'Global']
        );
        const customer = result.rows[0];
        const io = req.app.get('io');
        io.to('customers').emit('customers:change', { type: 'added', customer });
        res.status(201).json(customer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/customers/:id - Update
router.put('/:id', async (req, res) => {
    const { name, phone, gender, lastServices, lastPaymentMethod, totalSpent, shopId, shopName } = req.body;
    try {
        const result = await pool.query(
            `UPDATE customers SET name=$1, phone=$2, gender=$3, last_services=$4,
             last_payment_method=$5, total_spent=COALESCE($6, total_spent),
             shop_id=COALESCE($7, shop_id), shop_name=COALESCE($8, shop_name), updated_at=NOW()
             WHERE id=$9 RETURNING *`,
            [name, phone, gender, lastServices, lastPaymentMethod,
             totalSpent !== undefined ? totalSpent : null, shopId, shopName, req.params.id]
        );
        const customer = result.rows[0];
        const io = req.app.get('io');
        io.to('customers').emit('customers:change', { type: 'modified', customer });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/customers/:id/spent - Add to total_spent
router.patch('/:id/spent', async (req, res) => {
    const { amount, lastServices, lastPaymentMethod } = req.body;
    try {
        const result = await pool.query(
            `UPDATE customers SET total_spent = total_spent + $1,
             last_services = COALESCE($2, last_services),
             last_payment_method = COALESCE($3, last_payment_method),
             updated_at = NOW() WHERE id = $4 RETURNING *`,
            [parseFloat(amount) || 0, lastServices, lastPaymentMethod, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/customers/:id - Also delete their invoices
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM invoices WHERE customer_id = $1', [req.params.id]);
        await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
        const io = req.app.get('io');
        io.to('customers').emit('customers:change', { type: 'deleted', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
