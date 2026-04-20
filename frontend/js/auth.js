// auth.js - Login via OTP (no Firebase)
let generatedOTP = null;
let currentUserPhone = '';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

document.addEventListener('DOMContentLoaded', () => {
    const phoneGroup    = document.getElementById('phone-group');
    const otpGroup      = document.getElementById('otp-group');
    const accessDenied  = document.getElementById('access-denied');
    const phoneInput    = document.getElementById('auth-phone');
    const otpInput      = document.getElementById('auth-otp');
    const sendOtpBtn    = document.getElementById('send-otp-btn');
    const otpForm       = document.getElementById('otp-form');
    const tryAgainBtn   = document.getElementById('try-again-btn');

    sendOtpBtn.addEventListener('click', () => {
        const phone = phoneInput.value.trim();
        if (!phone || phone.length < 10) {
            window.showToast("Please enter a valid phone number");
            return;
        }
        currentUserPhone = phone;
        generatedOTP = generateOTP();
        window.showToast(`[DEMO MODE] OTP for ${phone} is: ${generatedOTP}`);
        phoneGroup.style.display = 'none';
        otpGroup.style.display = 'block';
    });

    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (otpInput.value.trim() !== generatedOTP) {
            window.showToast("Invalid OTP", "error");
            return;
        }

        try {
            const data = await window.apiCall('POST', '/api/auth/check', { phone: currentUserPhone });
            if (data.found) {
                const user = data.user;
                // Normalize for state
                const normalizedUser = {
                    id: user.id || user.uid,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    shopId: user.shop_id || user.shopId,
                    adminId: user.admin_id || user.adminId,
                    permissions: user.permissions || []
                };
                localStorage.setItem('salon_user', JSON.stringify(normalizedUser));
                
                if (normalizedUser.role === 'superadmin') {
                    window.location.href = 'superadmin/index.html';
                } else if (normalizedUser.role === 'admin') {
                    window.location.href = 'admin/dashboard.html';
                } else {
                    window.location.href = 'employee/index.html';
                }
            } else {
                otpGroup.style.display = 'none';
                accessDenied.style.display = 'block';
            }
        } catch (err) {
            window.showToast(err.message, "error");
        }
    });

    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            accessDenied.style.display = 'none';
            phoneGroup.style.display = 'block';
        });
    }
});
