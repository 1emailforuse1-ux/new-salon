// shops.js - Rewritten for CockroachDB backend with corrected IDs and Modal handling
import { checkAccess } from './role.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Selectors matching HTML IDs in both admin/shops.html and superadmin/shops.html
    const shopsList      = document.getElementById('shops-list') || document.getElementById('realtime-shops-list');
    const shopForm       = document.getElementById('shop-form');
    const addShopBtn     = document.getElementById('addShopBtn');
    const shopModal      = document.getElementById('shop-modal');
    const closeBtn       = document.getElementById('closeShopModal') || document.querySelector('.close') || document.querySelector('.close-modal');
    
    // Inputs
    const nameInput      = document.getElementById('shop-name-input') || document.getElementById('shop-name');
    const locationInput  = document.getElementById('shop-location-input') || document.getElementById('shop-location');
    const adminSelect    = document.getElementById('shop-admin-select') || document.getElementById('admin-shop');

    const user = await checkAccess();
    if (!user) return;

    const loadAdmins = async () => {
        if (!adminSelect) return;
        try {
            const admins = await window.apiCall('GET', '/api/admins');
            adminSelect.innerHTML = '<option value="">No Administrator Assigned</option>' + 
                admins.map(a => `<option value="${a.id}">${a.name} (${a.phone})</option>`).join('');
        } catch (err) { console.error('Error loading admins:', err); }
    };

    const loadShops = async () => {
        if (!shopsList) return;
        try {
            const shops = await window.apiCall('GET', '/api/shops');
            shopsList.innerHTML = shops.map(shop => `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar" style="background:#EBF5FF; color:#0066FF;">
                                <i class="fa-solid fa-store"></i>
                            </div>
                            <div>
                                <div class="user-name">${shop.shop_name}</div>
                                <div class="user-role">${shop.location || 'Branch'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${shop.admin_name || 'Unassigned'}</td>
                    <td>₹0.00</td>
                    <td>₹0.00</td>
                    <td>${new Date(shop.created_at).toLocaleDateString()}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary delete-btn" data-id="${shop.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Delete listener
            shopsList.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm('Delete this shop?')) {
                        try {
                            await window.apiCall('DELETE', `/api/shops/${btn.dataset.id}`);
                            loadShops();
                        } catch (err) { window.showToast(err.message, 'error'); }
                    }
                };
            });
        } catch (err) { 
            console.error(err);
            shopsList.innerHTML = '<tr><td colspan="6" style="text-align:center;">Error loading shops</td></tr>';
        }
    }

    if (addShopBtn) {
        addShopBtn.onclick = () => {
            loadAdmins();
            shopModal.classList.add('active'); // Use class for centering CSS
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            shopModal.classList.remove('active');
        };
    }

    // Explicitly handle Establish button if form submit isn't enough
    if (shopForm) {
        shopForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const body = {
                shopName: nameInput?.value,
                location: locationInput?.value || 'Branch',
                adminId: adminSelect?.value || null
            };

            if (!body.shopName) {
                window.showToast("Salon name is required", "error");
                return;
            }

            try {
                await window.apiCall('POST', '/api/shops', body);
                shopModal.classList.remove('active');
                shopForm.reset();
                loadShops();
                window.showToast('Salon onboarded successfully');
            } catch (err) { 
                window.showToast(err.message, 'error'); 
            }
        };
    }

    loadShops();
    window.getSocket().on('shops-updated', loadShops);
});
