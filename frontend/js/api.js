// ============================================================
// API CONFIG - Central client for all backend calls
// Replaces firebase-config.js
// ============================================================

// Auto-detect backend URL (local vs production)
const isLocal = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1' || 
                 window.location.hostname.startsWith('192.168.') || 
                 window.location.hostname.startsWith('10.') || 
                 window.location.hostname.startsWith('172.');

const PRODUCTION_BACKEND_URL = 'https://YOUR-BACKEND.onrender.com'; // ← REPLACE THIS after Render deployment

const API_BASE = isLocal 
    ? `http://${window.location.hostname}:3000`
    : PRODUCTION_BACKEND_URL;

// Socket.io connection (loaded via CDN in HTML)
let socket = null;

function getSocket() {
    if (!socket) {
        socket = io(API_BASE, { transports: ['websocket', 'polling'] });
        socket.on('connect', () => console.log('[SOCKET] Connected:', socket.id));
        socket.on('disconnect', () => console.log('[SOCKET] Disconnected'));
        socket.on('connect_error', (e) => console.warn('[SOCKET] Error:', e.message));
    }
    return socket;
}

// ─── API Helper ─────────────────────────────────────────────
async function apiCall(method, endpoint, body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(API_BASE + endpoint, options);
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || 'API Error: ' + response.status);
    }
    return response.json();
}

// ─── Scope helper: Build query params from localStorage user ─
function getScopeParams() {
    const user = JSON.parse(localStorage.getItem('salon_user') || '{}');
    const params = new URLSearchParams();
    if (user.role) params.set('role', user.role);
    if (user.shopId) params.set('shopId', user.shopId);
    if (user.adminId) params.set('adminId', user.adminId);
    return params.toString();
}

// ─── Toast Notification ─────────────────────────────────────
window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const isErr = type === 'error' || message.toLowerCase().includes('error') || message.toLowerCase().includes('failed');
    const bgColor = isErr ? '#FFEBEE' : '#E8FFF3';
    const textColor = isErr ? '#D32F2F' : '#17C666';
    const borderColor = isErr ? '#FFCDD2' : '#A7F3D0';
    const icon = isErr ? 'fa-circle-exclamation' : 'fa-circle-check';
    toast.style.cssText = `background:${bgColor};color:${textColor};padding:14px 20px;border-radius:8px;border:1px solid ${borderColor};font-weight:500;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.1);display:flex;align-items:center;gap:12px;transform:translateX(120%);transition:transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275);pointer-events:auto;`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

// Export (Window for legacy)
window.API_BASE = API_BASE;
window.apiCall = apiCall;
window.getScopeParams = getScopeParams;
window.getSocket = getSocket;
