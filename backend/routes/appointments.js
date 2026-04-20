const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/appointments?role=&shopId=&adminId=
router.get('/', async (req, res) => {
    const { role, shopId, adminId } = req.query;
    try {
        let query = 'SELECT * FROM appointments';
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

// POST /api/appointments
router.post('/', async (req, res) => {
    const { customerName, serviceName, staffName, date, time, status, adminId, shopId, shopName, bookedBy } = req.body;
    if (!customerName) return res.status(400).json({ error: 'customerName required' });
    try {
        const result = await pool.query(
            `INSERT INTO appointments
             (customer_name, service_name, staff_name, date, time, status, admin_id, shop_id, shop_name, booked_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [customerName, serviceName, staffName, date, time, status || 'pending',
             adminId || 'Global', shopId || null, shopName || 'Global', bookedBy || 'System']
        );
        const appt = result.rows[0];
        const io = req.app.get('io');
        io.to('appointments').emit('appointments:change', { type: 'added', appointment: appt });
        res.status(201).json(appt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/appointments/:id - Update status or full update
router.put('/:id', async (req, res) => {
    const { status, processedBy, customerName, serviceName, staffName, date, time } = req.body;
    try {
        const result = await pool.query(
            `UPDATE appointments
             SET status=$1, processed_by=$2, customer_name=COALESCE($3, customer_name),
                 service_name=COALESCE($4, service_name), staff_name=COALESCE($5, staff_name),
                 date=COALESCE($6, date), time=COALESCE($7, time), updated_at=NOW()
             WHERE id=$8 RETURNING *`,
            [status, processedBy || null, customerName, serviceName, staffName, date, time, req.params.id]
        );
        const appt = result.rows[0];
        const io = req.app.get('io');
        io.to('appointments').emit('appointments:change', { type: 'modified', appointment: appt });
        res.json(appt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
        const io = req.app.get('io');
        io.to('appointments').emit('appointments:change', { type: 'deleted', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
