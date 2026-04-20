// employee-portal.js - Rewritten for CockroachDB backend
import { checkAccess, getScopedQuery } from './role.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAccess();
    if (!user) return;

    // View Switching Logic
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.content-section');
    const sectionTitle = document.getElementById('section-title');

    navLinks.forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const target = link.dataset.section;
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`${target}-section`).classList.add('active');
            sectionTitle.textContent = target.charAt(0).toUpperCase() + target.slice(1);
            loadData(target);
        };
    });

    const loadData = async (section) => {
        const query = getScopedQuery();
        if (section === 'home') {
            const stats = await window.apiCall('GET', `/api/dashboard/stats?${query}`);
            document.getElementById('stat-appointments').textContent = stats.appointmentsToday || 0;
            document.getElementById('stat-customers').textContent = stats.customers || 0;
        } else if (section === 'appointments') {
            const data = await window.apiCall('GET', `/api/appointments?${query}`);
            const list = document.getElementById('appointments-list');
            list.innerHTML = data.map(a => `
                <tr>
                    <td>${a.customer_name}</td>
                    <td>${a.service_name}</td>
                    <td>${a.staff_name}</td>
                    <td>${a.appointment_time}</td>
                    <td><span class="status-badge status-${a.status}">${a.status}</span></td>
                    <td style="text-align:right;">
                        ${a.status === 'pending' ? `<button class="btn btn-primary complete-btn" data-id="${a.id}">Done</button>` : ''}
                    </td>
                </tr>
            `).join('');
            
            list.querySelectorAll('.complete-btn').forEach(b => b.onclick = async () => {
                await window.apiCall('PATCH', `/api/appointments/${b.dataset.id}`, { status: 'completed' });
                loadData('appointments');
            });
        } else if (section === 'services') {
            const data = await window.apiCall('GET', `/api/services?${query}`);
            document.getElementById('services-list').innerHTML = data.map(s => `
                <tr><td>${s.name}</td><td>${s.category}</td><td>${s.duration}m</td><td>₹${s.price}</td><td>Active</td></tr>
            `).join('');
        } else if (section === 'customers') {
            const data = await window.apiCall('GET', `/api/customers?${query}`);
            document.getElementById('customers-list').innerHTML = data.map(c => `
                <tr><td>${c.name}</td><td>${c.phone}</td><td>${c.email || '-'}</td><td>Cash</td><td>₹${c.total_spent || 0}</td></tr>
            `).join('');
        }
    };

    loadData('home');
    window.getSocket().on('data-updated', () => {
        const active = document.querySelector('.content-section.active').id.split('-')[0];
        loadData(active);
    });
});
