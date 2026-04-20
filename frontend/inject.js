const fs = require('fs');
const path = require('path');

const dirs = ['admin', 'superadmin', 'employee'];
const basePath = __dirname;

const scriptToInject = `    <!-- Inline script to prevent sidebar flicker -->
    <script>
        (function() {
            var userStr = localStorage.getItem('salon_user');
            if (!userStr) return;
            try {
                var user = JSON.parse(userStr);
                var role = user.role || '';
                
                // Whitelist approach: Hide sensitive menu items by default and only show permitted ones
                // This prevents the 'full panel' flicker during navigation
                var css = '#menu-dashboard, #menu-shops, #menu-admins, #menu-appointments, #menu-staff, #menu-services, #menu-customers, #menu-billing, #menu-inventory, #menu-reports { display: none !important; }';
                var show = [];

                if (role === 'employee') {
                    show = ['menu-dashboard', 'menu-appointments', 'menu-services', 'menu-customers'];
                } else if (role === 'admin') {
                    var perms = user.permissions || [];
                    if (perms.length > 0) {
                        show = perms;
                        // Always allow dashboard access if logged in as admin
                        if (show.indexOf('menu-dashboard') === -1) show.push('menu-dashboard');
                    } else {
                        // Default restricted set for admins without explicit permissions
                        show = ['menu-dashboard', 'menu-appointments', 'menu-staff', 'menu-services', 'menu-customers', 'menu-inventory', 'menu-reports'];
                    }
                } else if (role === 'superadmin') {
                    css = ''; // Superadmins see everything
                }

                if (css) {
                    if (show.length > 0) {
                        css += ' #' + show.join(', #') + ' { display: block !important; }';
                    }
                    var style = document.createElement('style');
                    style.innerHTML = css;
                    document.head.appendChild(style);
                }
            } catch(e) {}
        })();
    </script>
`;

const getSidebar = (role, currentFile) => {
    const isSuper = role === 'superadmin';
    const logo = isSuper ? '<i class="fa-solid fa-crown" style="color: #FFD700;"></i>' : '<i class="fa-solid fa-scissors"></i>';
    const title = isSuper ? 'Super Admin' : 'Salon Manager';
    const dashboardFile = isSuper ? 'index.html' : 'dashboard.html';
    const dashboardLabel = isSuper ? 'Overview' : 'Dashboard';

    const items = [
        { id: 'menu-dashboard', file: dashboardFile, label: dashboardLabel, icon: isSuper ? 'fa-gauge-high' : 'fa-house' },
        { id: 'menu-shops', file: 'shops.html', label: 'Shops', icon: 'fa-store' },
        { id: 'menu-admins', file: 'admins.html', label: 'Admins', icon: 'fa-user-shield' },
        { id: 'menu-appointments', file: 'appointments.html', label: 'Appointments', icon: 'fa-calendar-check' },
        { id: 'menu-staff', file: 'staff.html', label: 'Staff', icon: 'fa-users' },
        { id: 'menu-services', file: 'services.html', label: 'Services', icon: 'fa-scissors' },
        { id: 'menu-customers', file: 'customers.html', label: 'Customers', icon: 'fa-user-group' },
        { id: 'menu-billing', file: 'billing.html', label: 'Billing/Revenue', icon: 'fa-file-invoice-dollar' },
        { id: 'menu-inventory', file: 'inventory.html', label: 'Inventory', icon: 'fa-boxes-stacked' },
        { id: 'menu-reports', file: 'reports.html', label: 'Reports', icon: 'fa-chart-line' }
    ];

    let html = `        <!-- Sidebar -->
        <aside id="main-sidebar" class="sidebar">
            <div class="sidebar-logo">
                ${logo}
                <span>${title}</span>
            </div>
            <ul class="nav-links">
`;

    items.forEach(item => {
        const activeClass = item.file === currentFile ? 'nav-link active' : 'nav-link';
        html += `                <li id="${item.id}" class="nav-item"><a href="${item.file}" class="${activeClass}"><i class="fa-solid ${item.icon}"></i><span>${item.label}</span></a></li>\n`;
    });

    html += `            </ul>
            <div class="nav-item">
                <a href="#" id="logoutBtn" class="nav-link" style="color: #FF5B5B;"><i class="fa-solid fa-right-from-bracket"></i><span>Logout</span></a>
            </div>
        </aside>`;
    
    return html;
};

dirs.forEach(dir => {
    const dirPath = path.join(basePath, dir);
    if(fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
            if(file.endsWith('.html')) {
                const filePath = path.join(dirPath, file);
                let content = fs.readFileSync(filePath, 'utf8');
                
                // 1. Inject Head Script
                content = content.replace(/<!-- Inline script to prevent sidebar flicker -->[\s\S]*?<\/script>\s*/g, '');
                if (content.includes('</head>')) {
                    content = content.replace('</head>', scriptToInject + '</head>');
                }

                // 2. Inject/Update Sidebar
                const sidebarHtml = getSidebar(dir, file);
                const sidebarRegex = /<!-- Sidebar[\s\S]*?<\/aside>/;
                if (sidebarRegex.test(content)) {
                    content = content.replace(sidebarRegex, sidebarHtml);
                } else if (content.includes('<main')) {
                    // Prepend to main container if missing
                    content = content.replace('<main', sidebarHtml + '\n\n        <main');
                }

                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Processed ' + dir + '/' + file);
            }
        });
    }
});
