const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/dashboard/stats?role=&shopId=&adminId=
router.get('/stats', async (req, res) => {
    const { role, shopId, adminId } = req.query;
    try {
        const scopeClause = (table, joinField = 'shop_id') => {
            if (role === 'superadmin') return '';
            if (shopId) return ` WHERE ${table}.${joinField} = '${shopId}'`;
            if (adminId) return ` WHERE ${table}.admin_id = '${adminId}'`;
            return '';
        };

        const today = new Date().toISOString().split('T')[0];

        const [revRes, custRes, apptRes, shopsRes] = await Promise.all([
            pool.query(`SELECT COALESCE(SUM(total), 0) AS total FROM invoices${scopeClause('invoices')}`),
            pool.query(`SELECT COUNT(*) AS count FROM customers${scopeClause('customers')}`),
            pool.query(`SELECT COUNT(*) AS count FROM appointments${scopeClause('appointments')} ${scopeClause('appointments') ? 'AND' : 'WHERE'} date = '${today}'`),
            pool.query('SELECT COUNT(*) AS count FROM shops')
        ]);

        res.json({
            revenue: parseFloat(revRes.rows[0].total),
            customers: parseInt(custRes.rows[0].count),
            appointments: parseInt(apptRes.rows[0].count),
            shops: parseInt(shopsRes.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/analytics - Chart data (last 7 days)
router.get('/analytics', async (req, res) => {
    try {
        const [invRes, custRes, apptRes, shopsRes] = await Promise.all([
            pool.query('SELECT COALESCE(SUM(total),0) AS total FROM invoices'),
            pool.query('SELECT COUNT(*) AS count FROM customers'),
            pool.query('SELECT COUNT(*) AS count FROM appointments'),
            pool.query('SELECT COUNT(*) AS count FROM shops')
        ]);

        // 7-day revenue trend
        const revTrend = await pool.query(
            `SELECT date::text, SUM(total) AS total FROM invoices
             WHERE date >= NOW() - INTERVAL '7 days' GROUP BY date ORDER BY date`
        );
        // 7-day appointment trend
        const apptTrend = await pool.query(
            `SELECT date::text, COUNT(*) AS count FROM appointments
             WHERE date >= NOW() - INTERVAL '7 days' GROUP BY date ORDER BY date`
        );
        // Top services
        const topSvc = await pool.query(
            `SELECT service_name, COUNT(*) AS count FROM appointments
             WHERE service_name IS NOT NULL GROUP BY service_name ORDER BY count DESC LIMIT 5`
        );

        res.json({
            totals: {
                revenue: parseFloat(invRes.rows[0].total),
                customers: parseInt(custRes.rows[0].count),
                appointments: parseInt(apptRes.rows[0].count),
                shops: parseInt(shopsRes.rows[0].count)
            },
            revenueTrend: revTrend.rows,
            appointmentTrend: apptTrend.rows,
            topServices: topSvc.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
