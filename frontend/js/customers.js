// customers.js - Updated for SuperAdmin & Admin with Modal and Service support
import { checkAccess, getScopedQuery } from './role.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userData = await checkAccess();
    if (!userData) return;
    const { role, shopId, adminId } = userData;

    const list = document.getElementById('customers-list');
    const form = document.getElementById('customer-form');
    const modal = document.getElementById('customer-modal');
    const addBtn = document.getElementById('addCustBtn') || document.getElementById('addCustomerBtn');
    const closeBtn = document.getElementById('closeCustModal') || document.querySelector('.close');
    const servicesContainer = document.getElementById('modal-services-checkboxes');

    // Inputs
    const nameInput = document.getElementById('cu-name');
    const phoneInput = document.getElementById('cu-phone');
    const genderInput = document.getElementById('cu-gender');
    const paySelect = document.getElementById('modal-pay-select');

    let globalServices = [];

    const loadServices = async () => {
        if (!servicesContainer) return;
        const query = getScopedQuery();
        try {
            globalServices = await window.apiCall('GET', `/api/services?${query}`);
            servicesContainer.innerHTML = globalServices.map(s => `
                <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer;">
                    <input type="checkbox" class="service-check" name="selected_services" value="${s.name}" data-price="${s.price}">
                    <span>${s.name} (₹${s.price})</span>
                </label>
            `).join('');
            if (globalServices.length === 0) {
                servicesContainer.innerHTML = '<p style="grid-column: span 2; font-size: 12px; color: #888;">No platform services defined.</p>';
            }
        } catch (err) { console.error(err); }
    };

    const loadCustomers = async () => {
        if (!list) return;
        const query = getScopedQuery();
        try {
            const data = await window.apiCall('GET', `/api/customers?${query}`);
            list.innerHTML = data.map(c => `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.phone}</td>
                    <td><div style="font-size:12px; color:var(--text-muted); max-width:200px;">${c.last_services || 'None'}</div></td>
                    <td>${c.last_payment_method || 'Cash'}</td>
                    <td style="font-weight:600; color:var(--primary-color);">₹${parseFloat(c.total_spent || 0).toFixed(2)}</td>
                    <td>${c.shop_name || 'Global'}</td>
                    <td style="text-align: right;">
                        <button class="btn-icon btn-delete del-btn" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');

            list.querySelectorAll('.del-btn').forEach(b => b.onclick = async () => {
                if(confirm('Remove this customer record?')) { 
                    await window.apiCall('DELETE', `/api/customers/${b.dataset.id}`); 
                    loadCustomers(); 
                    window.showToast('Record removed');
                }
            });
        } catch (err) { console.error(err); }
    };

    if (addBtn) {
        addBtn.onclick = () => {
            loadServices();
            modal.classList.add('active');
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('active');
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const selectedChecks = Array.from(document.querySelectorAll('input[name="selected_services"]:checked'));
            const services = selectedChecks.map(cb => cb.value).join(', ');
            const total = selectedChecks.reduce((acc, cb) => acc + parseFloat(cb.dataset.price), 0);

            const body = {
                name: nameInput.value,
                phone: phoneInput.value,
                gender: genderInput.value,
                lastServices: services,
                lastPaymentMethod: paySelect.value,
                totalSpent: total,
                shopId: shopId || null,
                adminId: adminId
            };

            try {
                await window.apiCall('POST', '/api/customers', body);
                modal.classList.remove('active');
                form.reset();
                loadCustomers();
                window.showToast('Customer & Bill registered successfully');
            } catch (err) { window.showToast(err.message, 'error'); }
        };
    }

    loadCustomers();
    // Socket updates
    window.getSocket().on('customers:change', loadCustomers);
});
