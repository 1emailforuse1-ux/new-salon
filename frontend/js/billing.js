// billing.js - Rewritten for CockroachDB backend
import { checkAccess, getScopedQuery } from './role.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userData = await checkAccess();
    if (!userData) return;
    const { role, shopId, adminId } = userData;

    const list = document.getElementById('billing-list');
    const summaryRevenue = document.getElementById('summary-revenue');

    const loadBilling = async () => {
        const query = getScopedQuery();
        const data = await window.apiCall('GET', `/api/invoices?${query}`);
        let total = 0;
        list.innerHTML = data.map(inv => {
            total += parseFloat(inv.amount);
            return `
                <tr>
                    <td>INV-${inv.id.substring(0,5)}</td>
                    <td>${inv.customer_name}</td>
                    <td>${inv.service_name}</td>
                    <td>₹${inv.amount}</td>
                    <td>${new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>
            `;
        }).join('');
        if(summaryRevenue) summaryRevenue.textContent = `₹${total.toFixed(2)}`;
    };

    loadBilling();
    window.getSocket().on('invoices-updated', loadBilling);
});
