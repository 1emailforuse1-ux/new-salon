// dashboard.js - Rewritten for CockroachDB backend
import { checkAccess, getScopedQuery } from './role.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAccess();
    if (!user) return;

    const statsRevenue = document.getElementById('stat-revenue');
    const statsCustomers = document.getElementById('stat-customers');
    const statsAppts = document.getElementById('stat-appointments');

    const loadStats = async () => {
        const query = getScopedQuery();
        const stats = await window.apiCall('GET', `/api/dashboard/stats?${query}`);
        if(statsRevenue) statsRevenue.textContent = `₹${parseFloat(stats.revenue || 0).toFixed(2)}`;
        if(statsCustomers) statsCustomers.textContent = stats.customers || 0;
        if(statsAppts) statsAppts.textContent = stats.appointmentsToday || 0;
    };

    loadStats();
    
    // Listen for any update to refresh stats
    const socket = window.getSocket();
    socket.on('data-updated', loadStats);
    socket.on('appointments-updated', loadStats);
    socket.on('invoices-updated', loadStats);
});
