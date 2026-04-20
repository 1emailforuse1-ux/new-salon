const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/staff?role=&shopId=&adminId=
router.get('/', async (req, res) => {
    const { role, shopId, adminId } = req.query;
    try {
        let query = 'SELECT * FROM staff';
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

// GET /api/staff/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/staff
router.post('/', async (req, res) => {
    const { name, phone, role, specialty, adminId, shopId } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });
    const id = 'user_' + Date.now();
    try {
        const result = await pool.query(
            `INSERT INTO staff (id, name, phone, role, specialty, admin_id, shop_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [id, name, phone, role || 'employee', specialty || 'General Staff', adminId || null, shopId || null]
        );
        const staff = result.rows[0];
        const io = req.app.get('io');
        io.to('staff').emit('staff:change', { type: 'added', staff });
        res.status(201).json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/staff/:id
router.put('/:id', async (req, res) => {
    const { name, phone, specialty, shopId, permissions } = req.body;
    try {
        const result = await pool.query(
            `UPDATE staff SET name = $1, phone = $2, specialty = $3, shop_id = $4, permissions = $5 
             WHERE id = $6 RETURNING *`,
            [name, phone, specialty || 'General Staff', shopId || null, JSON.stringify(permissions || []), req.params.id]
        );
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Staff member not found' });
        
        const staff = result.rows[0];
        const io = req.app.get('io');
        // Notify the specific staff member for permission sync
        io.emit('staff-permissions-updated', { staffId: req.params.id, permissions: permissions || [] });
        // Notify lists
        io.emit('staff:change', { type: 'updated', staff });
        
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM staff WHERE id = $1', [req.params.id]);
        const io = req.app.get('io');
        io.emit('staff:change', { type: 'deleted', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
