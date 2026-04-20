// superadmin_realtime.js - SuperAdmin specific overview
import { checkAccess } from './role.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAccess();
    if (!user || user.role !== 'superadmin') return;

    const shopsList = document.getElementById('realtime-shops-list');
    const adminsList = document.getElementById('realtime-admins-list');

    const loadShops = async () => {
        const shops = await window.apiCall('GET', '/api/shops');
        shopsList.innerHTML = shops.map(s => `<tr><td>${s.shop_name}</td><td>${s.admin_name || 'Unassigned'}</td></tr>`).join('');
    };

    const loadAdmins = async () => {
        const admins = await window.apiCall('GET', '/api/admins');
        adminsList.innerHTML = admins.map(a => `<tr><td>${a.name}</td><td>${a.phone}</td></tr>`).join('');
    };

    loadShops();
    loadAdmins();

    const socket = window.getSocket();
    socket.on('shops-updated', loadShops);
    socket.on('admins-updated', loadAdmins);
});
