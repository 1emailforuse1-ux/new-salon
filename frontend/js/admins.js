// admins.js - Updated with Edit functionality and Permissions support
import { checkAccess } from './role.js';

document.addEventListener('DOMContentLoaded', async () => {
    const adminsList    = document.getElementById('admins-list');
    const adminModal    = document.getElementById('admin-modal');
    const adminForm     = document.getElementById('admin-form');
    const addAdminBtn   = document.getElementById('addAdminBtn');
    const closeBtn      = document.getElementById('closeAdminModal') || document.querySelector('.close');
    const modalTitle    = document.getElementById('modal-title');
    
    // Inputs
    const idInput       = document.getElementById('admin-id');
    const nameInput     = document.getElementById('admin-name');
    const phoneInput    = document.getElementById('admin-phone');
    const shopSelect    = document.getElementById('admin-shop-id') || document.getElementById('admin-shop');
    const checkboxes    = document.querySelectorAll('.perm-check');

    const user = await checkAccess();
    if (!user) return;

    const loadShops = async () => {
        if (!shopSelect) return;
        try {
            const shops = await window.apiCall('GET', '/api/shops');
            shopSelect.innerHTML = '<option value="">Global (No assigned branch)</option>' + 
                shops.map(s => `<option value="${s.id}">${s.shop_name}</option>`).join('');
        } catch (err) { console.error(err); }
    };

    const loadAdmins = async () => {
        if (!adminsList) return;
        try {
            const admins = await window.apiCall('GET', '/api/admins');
            adminsList.innerHTML = admins.map(a => `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar" style="background:#F0F7FF; color:#0066FF;"><i class="fa-solid fa-user-shield"></i></div>
                            <div>
                                <div class="user-name">${a.name}</div>
                                <div class="user-role">Administrator</div>
                            </div>
                        </div>
                    </td>
                    <td>${a.phone}</td>
                    <td>${a.shop_name || 'Global Platform'}</td>
                    <td><span class="status-badge status-active">Active</span></td>
                    <td>${new Date(a.created_at).toLocaleDateString()}</td>
                    <td style="text-align: right;">
                        <div class="action-btns">
                            <button class="btn-icon btn-edit edit-btn" data-id="${a.id}">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn-icon btn-delete delete-btn" data-id="${a.id}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // Edit listener
            adminsList.querySelectorAll('.edit-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    const admin = admins.find(x => x.id === id);
                    if (!admin) return;

                    await loadShops();
                    modalTitle.textContent = "Edit Admin Access Control";
                    idInput.value = admin.id;
                    nameInput.value = admin.name;
                    phoneInput.value = admin.phone;
                    if (shopSelect) shopSelect.value = admin.shop_id || "";
                    
                    // Set permissions
                    const perms = admin.permissions || [];
                    checkboxes.forEach(cb => {
                        if (cb.value !== 'menu-dashboard') { // Dashboard is always checked
                            cb.checked = perms.includes(cb.value);
                        }
                    });

                    adminModal.classList.add('active');
                };
            });

            // Delete listener
            adminsList.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm('Delete this admin?')) {
                        await window.apiCall('DELETE', `/api/admins/${btn.dataset.id}`);
                        loadAdmins();
                    }
                };
            });
        } catch (err) { console.error(err); }
    };

    if (addAdminBtn) {
        addAdminBtn.onclick = () => {
            modalTitle.textContent = "Provision Admin Credentials";
            idInput.value = "";
            adminForm.reset();
            checkboxes.forEach(cb => { if(cb.value !== 'menu-dashboard') cb.checked = false; });
            loadShops();
            adminModal.classList.add('active');
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => adminModal.classList.remove('active');
    }

    if (adminForm) {
        adminForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const permissions = Array.from(document.querySelectorAll('.perm-check:checked')).map(cb => cb.value);
            const id = idInput.value;
            
            const body = {
                name: nameInput.value,
                phone: phoneInput.value,
                shopId: shopSelect.value || null,
                permissions: permissions
            };

            try {
                if (id) {
                    await window.apiCall('PUT', `/api/admins/${id}`, body);
                    window.showToast('Administrator updated successfully');
                } else {
                    await window.apiCall('POST', '/api/admins', body);
                    window.showToast('Administrator authorized successfully');
                }
                adminModal.classList.remove('active');
                adminForm.reset();
                loadAdmins();
            } catch (err) {
                window.showToast(err.message, 'error');
            }
        };
    }

    loadAdmins();
    window.getSocket().on('admins-updated', loadAdmins);
});
