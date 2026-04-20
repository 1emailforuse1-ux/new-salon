require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/shops',        require('./routes/shops'));
app.use('/api/admins',       require('./routes/admins'));
app.use('/api/staff',        require('./routes/staff'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/services',     require('./routes/services'));
app.use('/api/customers',    require('./routes/customers'));
app.use('/api/invoices',     require('./routes/invoices'));
app.use('/api/inventory',    require('./routes/inventory'));
app.use('/api/superadmins',  require('./routes/superadmins'));
app.use('/api/dashboard',    require('./routes/dashboard'));

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', db: 'CockroachDB' }));

// ─── Socket.io ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log('[SOCKET] Client connected:', socket.id);

    // Client joins a room by entity name (e.g., 'shops', 'staff', etc.)
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`[SOCKET] ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('[SOCKET] Client disconnected:', socket.id);
    });
});

// ─── DB Init + Server Start ────────────────────────────────────────────────
async function startServer() {
    // Quick connectivity test
    try {
        await pool.query('SELECT 1');
        console.log('[DB] Connection verified ✔');
    } catch (err) {
        console.error('[DB] CANNOT CONNECT:', err.message);
        console.error('Check your DATABASE_URL in .env');
        process.exit(1);
    }

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`\n🚀 Salon Backend running on http://localhost:${PORT}`);
        console.log(`📡 Socket.io ready`);
        console.log(`🗄️  CockroachDB: salon_db\n`);
    });
}

startServer();
