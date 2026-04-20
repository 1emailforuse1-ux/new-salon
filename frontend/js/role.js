// role.js - Session management & RBAC 


window.userRole = null;
window.userAdminId = null;

// ─── Logout ───────────────────────────────────────────────────
window.logoutUser = () => {
    localStorage.removeItem('salon_user');
    const inFolder = window.location.pathname.includes('/admin/') || 
                     window.location.pathname.includes('/superadmin/') || 
                     window.location.pathname.includes('/employee/');
    window.location.href = inFolder ? '../index.html' : 'index.html';
};

// ─── Apply Permissions UI ──────────────────────────────────────
function applyPermissionsUI(user) {
    if (!user) return;
    const role = user.role;
    const perms = user.permissions || [];
    
    // Remove any existing dynamic permission styles
    const allStyles = document.querySelectorAll('style');
    allStyles.forEach(s => {
        if (s.hasAttribute('data-perm-css') || s.innerHTML.includes('#menu-dashboard, #menu-shops')) {
            s.remove();
        }
    });

    let show = [];
    if (role === 'employee') {
        show = ['menu-dashboard', 'menu-appointments', 'menu-services', 'menu-customers'];
    } else if (role === 'admin') {
        show = perms.length > 0 ? [...perms] : ['menu-dashboard', 'menu-appointments', 'menu-staff', 'menu-services', 'menu-customers', 'menu-inventory', 'menu-reports'];
        if (!show.includes('menu-dashboard')) show.push('menu-dashboard');
    } else if (role === 'superadmin') {
        // Superadmin shows everything, so we don't need to hide anything
        return;
    }

    // Generate and inject CSS
    const allItems = ['menu-dashboard', 'menu-shops', 'menu-admins', 'menu-appointments', 'menu-staff', 'menu-services', 'menu-customers', 'menu-billing', 'menu-inventory', 'menu-reports'];
    let css = allItems.map(id => `#${id} { display: none !important; }`).join(' ');
    if (show.length > 0) {
        css += ' #' + show.join(', #') + ' { display: block !important; }';
    }

    const style = document.createElement('style');
    style.setAttribute('data-perm-css', 'true');
    style.innerHTML = css;
    document.head.appendChild(style);

    // Update Display Info
    const nameEl = document.getElementById('display-name');
    const roleEl = document.getElementById('display-role');
    const branchEl = document.getElementById('display-branch');
    const logoutBtn = document.getElementById('logoutBtn');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    if (branchEl) branchEl.textContent = user.shopName || (user.role === 'superadmin' ? 'Global' : 'Assigned');
    if (logoutBtn) logoutBtn.onclick = (e) => { e.preventDefault(); window.logoutUser(); };

    // Dashboard link fix
    const dashboardLink = document.getElementById('menu-dashboard')?.querySelector('a');
    const inFolder = window.location.pathname.includes('/admin/') || 
                     window.location.pathname.includes('/superadmin/') || 
                     window.location.pathname.includes('/employee/');
                     
    if (user.role === 'employee') {
        if (dashboardLink) dashboardLink.href = inFolder ? 'index.html' : 'employee/index.html';
    } else if (user.role === 'admin') {
        if (dashboardLink) dashboardLink.href = inFolder ? 'dashboard.html' : 'admin/dashboard.html';
    }
}

// ─── Access Check ──────────────────────────────────────────────
export async function checkAccess() {
    const userStr = localStorage.getItem('salon_user');
    const inFolder = window.location.pathname.includes('/admin/') || 
                     window.location.pathname.includes('/superadmin/') || 
                     window.location.pathname.includes('/employee/');

    if (!userStr) {
        window.location.href = inFolder ? '../index.html' : 'index.html';
        return null;
    }

    let user = JSON.parse(userStr);
    
    // Initial UI apply from storage (prevents flicker of missing items if storage is valid)
    applyPermissionsUI(user);

    // Re-fetch latest profile from backend to sync permissions/role
    try {
        const latestUser = await window.apiCall('POST', '/api/auth/check', { phone: user.phone });
        if (latestUser && latestUser.found) {
            user = { ...user, ...latestUser.user };
            localStorage.setItem('salon_user', JSON.stringify(user));
            // Re-apply UI with new data
            applyPermissionsUI(user);
        }
    } catch (err) {
        console.warn('Profile sync failed:', err.message);
    }

    window.userRole = user.role;
    window.userAdminId = user.adminId;

    return user;
}

// Socket listener for real-time updates
(function setupSocket() {
    const socket = window.getSocket();
    socket.on('admin-permissions-updated', (data) => {
        const currentUser = JSON.parse(localStorage.getItem('salon_user') || '{}');
        if (currentUser.id === data.adminId && currentUser.role === 'admin') {
            currentUser.permissions = data.permissions;
            localStorage.setItem('salon_user', JSON.stringify(currentUser));
            window.showToast('Your permissions have been updated', 'info');
            // Immediate UI update
            applyPermissionsUI(currentUser);
        }
    });

    socket.on('staff-permissions-updated', (data) => {
        const currentUser = JSON.parse(localStorage.getItem('salon_user') || '{}');
        if (currentUser.id === data.staffId && currentUser.role === 'employee') {
            currentUser.permissions = data.permissions;
            localStorage.setItem('salon_user', JSON.stringify(currentUser));
            window.showToast('Your permissions have been updated', 'info');
            applyPermissionsUI(currentUser);
        }
    });

    socket.on('data-updated', (data) => {
        console.log('[REALTIME] Data changed:', data.type);
    });
})();

// ─── Query building with scope ─────────────────────────────────
export function getScopedQuery() {
    const user = JSON.parse(localStorage.getItem('salon_user') || '{}');
    const q = new URLSearchParams();
    if (user.role) q.set('role', user.role);
    if (user.shopId) q.set('shopId', user.shopId);
    if (user.adminId) q.set('adminId', user.adminId);
    return q.toString();
}
