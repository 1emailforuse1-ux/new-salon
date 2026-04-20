// appointments.js - Rewritten for CockroachDB backend with corrected IDs and Name resolving
import { checkAccess, getScopedQuery } from './role.js';

let globalStaffCache = [];
let globalServiceCache = [];
let userData = null;

document.addEventListener('DOMContentLoaded', async () => {
    userData = await checkAccess();
    if (!userData) return;

    const list = document.getElementById('appointments-list');
    const form = document.getElementById('appointment-form');
    const modal = document.getElementById('appointment-modal');
    const addBtn = document.getElementById('addApptBtn') || document.getElementById('addAppointmentBtn');
    const closeBtn = document.getElementById('close-appt-modal') || document.querySelector('.close');
    
    // Inputs
    const shopSel = document.getElementById('appt-shop-id') || document.getElementById('appt-shop');
    const staffSel = document.getElementById('appt-staff');
    const serviceSel = document.getElementById('appt-service');
    const nameInput = document.getElementById('customer-name') || document.getElementById('appt-customer');
    const phoneInput = document.getElementById('customer-phone') || document.getElementById('appt-phone');
    const dateInput = document.getElementById('appt-date');
    const timeInput = document.getElementById('appt-time');
    const statusSel = document.getElementById('appt-status') || document.getElementById('appt-status-select');

    const loadMetadata = async () => {
        const query = getScopedQuery();
        try {
            if (shopSel && userData.role === 'superadmin') {
                const shops = await window.apiCall('GET', '/api/shops');
                shopSel.innerHTML = '<option value="">Select Branch...</option>' + 
                    shops.map(s => `<option value="${s.id}">${s.shop_name}</option>`).join('');
            }
            
            globalStaffCache = await window.apiCall('GET', `/api/staff?${query}`);
            globalServiceCache = await window.apiCall('GET', `/api/services?${query}`);
            
            if (staffSel) staffSel.innerHTML = '<option value="">Select Staff</option>' + 
                globalStaffCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            
            if (serviceSel) serviceSel.innerHTML = '<option value="">Select Service</option>' + 
                globalServiceCache.map(s => `<option value="${s.id}">${s.name} (₹${s.price})</option>`).join('');
        } catch (err) { console.error(err); }
    };

    const loadAppointments = async () => {
        if (!list) return;
        const query = getScopedQuery();
        try {
            const data = await window.apiCall('GET', `/api/appointments?${query}`);
            list.innerHTML = data.map(a => `
                <tr>
                    <td>${a.customer_name}<br><small>${a.customer_phone || ''}</small></td>
                    <td>${a.service_name}</td>
                    <td>${a.staff_name || 'Unassigned'}</td>
                    <td>${new Date(a.appointment_date).toLocaleDateString()} ${a.appointment_time}</td>
                    <td><span class="status-badge badge-${a.status}">${a.status}</span></td>
                    <td>${a.shop_name || 'Global'}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary del-btn" data-id="${a.id}"><i class="fa-solid fa-trash"></i></button>
                        ${a.status === 'pending' ? `<button class="btn btn-primary complete-btn" data-id="${a.id}">Done</button>` : ''}
                    </td>
                </tr>
            `).join('');

            list.querySelectorAll('.del-btn').forEach(b => b.onclick = async () => { 
                if(confirm('Delete appointment?')) { await window.apiCall('DELETE', `/api/appointments/${b.dataset.id}`); loadAppointments(); }
            });

            list.querySelectorAll('.complete-btn').forEach(b => b.onclick = async () => {
                await window.apiCall('PATCH', `/api/appointments/${b.dataset.id}`, { status: 'completed' });
                loadAppointments();
            });
        } catch (err) { console.error(err); }
    };

    if (addBtn) {
        addBtn.onclick = () => { 
            loadMetadata(); 
            modal.classList.add('active'); 
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('active');
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            // Resolve Names from IDs
            const serviceObj = globalServiceCache.find(s => s.id === serviceSel?.value);
            const staffObj = globalStaffCache.find(s => s.id === staffSel?.value);
            
            const body = {
                customerName: nameInput?.value,
                customerPhone: phoneInput?.value || '0000000000',
                serviceName: serviceObj ? serviceObj.name : 'Service',
                staffName: staffObj ? staffObj.name : 'Any',
                date: dateInput?.value,
                time: timeInput?.value,
                status: statusSel?.value || 'pending',
                shopId: shopSel?.value || userData.shopId,
                adminId: userData.adminId
            };
            try {
                await window.apiCall('POST', '/api/appointments', body);
                modal.classList.remove('active');
                form.reset();
                loadAppointments();
                window.showToast('Appointment booked');
            } catch (err) { window.showToast(err.message, "error"); }
        };
    }

    loadAppointments();
    window.getSocket().on('appointments-updated', loadAppointments);
});
