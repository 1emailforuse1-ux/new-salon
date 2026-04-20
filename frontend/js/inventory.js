// inventory.js - Rewritten for CockroachDB backend with correct field names
import { checkAccess, getScopedQuery } from './role.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userData = await checkAccess();
    if (!userData) return;

    const list = document.getElementById('inventory-list');
    const form = document.getElementById('inventory-form');
    const modal = document.getElementById('inventory-modal');
    const addBtn = document.getElementById('addInventoryBtn');
    const closeBtn = document.getElementById('close-inventory-modal') || document.querySelector('.close');

    const loadInventory = async () => {
        if (!list) return;
        const query = getScopedQuery();
        try {
            const data = await window.apiCall('GET', `/api/inventory?${query}`);
            list.innerHTML = data.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.stock} Units</td>
                    <td><span class="status-badge ${item.stock < 10 ? 'badge-cancelled' : 'status-active'}">
                        ${item.stock < 10 ? 'Low Stock' : 'In Stock'}
                    </span></td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary del-btn" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
            
            list.querySelectorAll('.del-btn').forEach(b => b.onclick = async () => {
                if(confirm('Delete item?')) { await window.apiCall('DELETE', `/api/inventory/${b.dataset.id}`); loadInventory(); }
            });
        } catch (err) { console.error(err); }
    };

    if(addBtn) addBtn.onclick = () => modal.classList.add('active');
    if(closeBtn) closeBtn.onclick = () => modal.classList.remove('active');

    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const body = {
                name: document.getElementById('inv-name').value,
                stock: parseInt(document.getElementById('inv-qty').value),
                category: document.getElementById('inv-category')?.value || 'General',
                price: parseFloat(document.getElementById('inv-price')?.value || 0),
                shopId: userData.shopId,
                adminId: userData.adminId
            };
            try {
                await window.apiCall('POST', '/api/inventory', body);
                modal.classList.remove('active');
                form.reset();
                loadInventory();
                window.showToast('Item added to inventory');
            } catch (err) { window.showToast(err.message, 'error'); }
        }
    }

    loadInventory();
});
