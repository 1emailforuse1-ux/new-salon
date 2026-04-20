// services.js - Updated with dependent Category dropdown logic
import { checkAccess, getScopedQuery } from './role.js';

const SERVICE_MAP = {
    "Hair Services": [
        "Haircut & Styling", "Hair Coloring", "Hair Treatments", "Blow Dry", "Perms / Straightening", "Hair Extensions", "Head Massage"
    ],
    "Skin / Facial Services": [
        "Basic Clean-up", "Hydrating Facial", "Anti-Aging Facial", "Acne Treatment", "Fruit Facial", "Premium Glo Facial", "Face Bleach"
    ],
    "Nail Services": [
        "Manicure", "Pedicure", "Nail Art", "Gel Polish", "Nail Extensions", "Cut & File"
    ],
    "Hair Removal Services": [
        "Waxing (Full Body)", "Waxing (Underarms/Arms)", "Threading (Eyebrows)", "Threading (Full Face)", "Full Leg Waxing"
    ],
    "Makeup Services": [
        "Bridal Makeup", "Party Makeup", "Day/Evening Look", "Engagements Look", "Eye Makeup"
    ],
    "Spa & Massage": [
        "Full Body Massage", "Back/Shoulder Massage", "Foot Reflexology", "Body Scrub / Polish", "Aromatherapy"
    ],
    "Men’s Grooming": [
        "Shaving", "Beard Trimming", "Men's Haircut", "Face Massage (Men)", "D-tan Treatment"
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    const userData = await checkAccess();
    if (!userData) return;
    const { role, shopId, adminId } = userData;

    const list = document.getElementById('services-list');
    const form = document.getElementById('service-form');
    const modal = document.getElementById('service-modal');
    const addBtn = document.getElementById('addServiceBtn');
    const closeBtn = document.getElementById('close-service-modal') || document.querySelector('.close');

    // Inputs
    const nameInput = document.getElementById('sv-name') || document.getElementById('service-name');
    const catInput = document.getElementById('sv-category') || document.getElementById('service-category');
    const shopSel  = document.getElementById('sv-shop-select') || document.getElementById('service-shop');
    const durInput = document.getElementById('sv-duration') || document.getElementById('service-duration');
    const priceInput = document.getElementById('sv-price') || document.getElementById('service-price');

    // Populate Category based on Group
    if (nameInput && catInput) {
        nameInput.onchange = () => {
            const group = nameInput.value;
            const options = SERVICE_MAP[group] || [];
            catInput.innerHTML = '<option value="">-- Select Category --</option>' + 
                options.map(o => `<option value="${o}">${o}</option>`).join('');
        };
    }

    const loadShops = async () => {
        if (!shopSel || role !== 'superadmin') return;
        try {
            const shops = await window.apiCall('GET', '/api/shops');
            shopSel.innerHTML = '<option value="">Global Service (All Branches)</option>' + 
                shops.map(s => `<option value="${s.id}">${s.shop_name}</option>`).join('');
        } catch (err) { console.error(err); }
    };

    const loadServices = async () => {
        if (!list) return;
        const query = getScopedQuery();
        try {
            const data = await window.apiCall('GET', `/api/services?${query}`);
            list.innerHTML = data.map(s => `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar" style="background:#F0F7FF; color:#0066FF;"><i class="fa-solid fa-scissors"></i></div>
                            <div class="user-name">${s.name}</div>
                        </div>
                    </td>
                    <td>${s.category || 'N/A'}</td>
                    <td>${s.shop_name || 'Global'}</td>
                    <td>${s.duration} min</td>
                    <td>₹${s.price}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary del-btn" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');

            list.querySelectorAll('.del-btn').forEach(b => b.onclick = async () => {
                if(confirm('Delete service?')) { await window.apiCall('DELETE', `/api/services/${b.dataset.id}`); loadServices(); }
            });
        } catch (err) { console.error(err); }
    };

    if (addBtn) {
        addBtn.onclick = () => {
            loadShops();
            modal.classList.add('active');
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('active');
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const body = {
                name: nameInput.value,
                category: catInput?.value || 'General',
                duration: durInput.value,
                price: priceInput.value,
                shopId: (role === 'superadmin') ? (shopSel?.value || null) : shopId,
                adminId: adminId
            };
            try {
                await window.apiCall('POST', '/api/services', body);
                modal.classList.remove('active');
                form.reset();
                loadServices();
                window.showToast('Service added successfully');
            } catch (err) { window.showToast(err.message, 'error'); }
        };
    }

    loadServices();
    window.getSocket().on('services-updated', loadServices);
});
