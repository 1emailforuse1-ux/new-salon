// staff.js - Updated with Edit functionality and Permissions support
import { checkAccess, getScopedQuery } from './role.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userData = await checkAccess();
    if (!userData) return;
    const { role, shopId, adminId } = userData;

    const staffList    = document.getElementById('staff-list');
    const staffForm    = document.getElementById('staff-form');
    const staffModal   = document.getElementById('staff-modal');
    const addStaffBtn  = document.getElementById('addStaffBtn');
    const closeBtn     = document.getElementById('closeStaffModal') || document.querySelector('.close');
    const modalTitle   = document.getElementById('modal-title');
    
    // Inputs
    const idInput      = document.getElementById('staff-id');
    const nameInput    = document.getElementById('st-name') || document.getElementById('staff-name');
    const phoneInput   = document.getElementById('st-phone') || document.getElementById('staff-phone');
    const shopSelect   = document.getElementById('st-shop-id') || document.getElementById('staff-shop');
    const specialtyInput = document.getElementById('staff-specialty') || document.getElementById('st-specialty');
    const checkboxes   = document.querySelectorAll('.perm-check');

    const loadShops = async () => {
        if (!shopSelect) return;
        try {
            const shops = await window.apiCall('GET', '/api/shops');
            shopSelect.innerHTML = '<option value="">Global / No Shop</option>' + 
                shops.map(s => `<option value="${s.id}">${s.shop_name}</option>`).join('');
        } catch (err) { console.error(err); }
    };

    const loadStaff = async () => {
        if (!staffList) return;
        const query = getScopedQuery();
        try {
            const staff = await window.apiCall('GET', `/api/staff?${query}`);
            staffList.innerHTML = staff.map(s => `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar" style="background:#f0fcfc; color:#00cccc;"><i class="fa-solid fa-user-tag"></i></div>
                            <div>
                                <div class="user-name">${s.name}</div>
                                <div class="user-role">${s.specialty || 'Employee'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${s.phone}</td>
                    <td>${s.shop_name || 'Global Platform'}</td>
                    <td style="text-align: right;">
                        <div class="action-btns">
                            <button class="btn-icon btn-edit edit-btn" data-id="${s.id}">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn-icon btn-delete delete-btn" data-id="${s.id}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // Edit listener
            staffList.querySelectorAll('.edit-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    const member = staff.find(x => x.id === id);
                    if (!member) return;

                    await loadShops();
                    modalTitle.textContent = "Edit Employee Access Control";
                    idInput.value = member.id;
                    nameInput.value = member.name;
                    phoneInput.value = member.phone;
                    if (shopSelect) shopSelect.value = member.shop_id || "";
                    if (specialtyInput) specialtyInput.value = member.specialty || "";
                    
                    // Set permissions
                    const perms = member.permissions || [];
                    checkboxes.forEach(cb => {
                        if (cb.value !== 'menu-dashboard') {
                            cb.checked = perms.includes(cb.value);
                        }
                    });

                    staffModal.classList.add('active');
                };
            });

            // Delete listener
            staffList.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm('Delete this staff member?')) {
                        await window.apiCall('DELETE', `/api/staff/${btn.dataset.id}`);
                        loadStaff();
                        window.showToast('Staff member removed');
                    }
                };
            });
        } catch (err) { console.error(err); }
    };

    if (addStaffBtn) {
        addStaffBtn.onclick = () => { 
            modalTitle.textContent = "New Global Staff Member";
            idInput.value = "";
            staffForm.reset();
            checkboxes.forEach(cb => { if(cb.value !== 'menu-dashboard') cb.checked = false; });
            loadShops();
            staffModal.classList.add('active'); 
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => staffModal.classList.remove('active');
    }

    if (staffForm) {
        staffForm.onsubmit = async (e) => {
            e.preventDefault();
            const permissions = Array.from(document.querySelectorAll('.perm-check:checked')).map(cb => cb.value);
            const id = idInput.value;
            
            const body = {
                name: nameInput.value,
                phone: phoneInput.value,
                specialty: specialtyInput?.value || 'Staff',
                shopId: shopSelect ? (shopSelect.value || null) : null,
                adminId: adminId,
                permissions: permissions
            };

            try {
                if (id) {
                    await window.apiCall('PUT', `/api/staff/${id}`, body);
                    window.showToast('Staff member updated');
                } else {
                    await window.apiCall('POST', '/api/staff', body);
                    window.showToast('Staff member authorized');
                }
                staffModal.classList.remove('active');
                staffForm.reset();
                loadStaff();
            } catch (err) { window.showToast(err.message, 'error'); }
        };
    }

    loadStaff();
    window.getSocket().on('staff:change', loadStaff);
});
