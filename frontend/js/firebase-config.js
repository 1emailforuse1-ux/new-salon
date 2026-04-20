// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYjhKmzge4AN01sgGbHsa23PXgEWRRKfQ",
  authDomain: "salon-30f7d.firebaseapp.com",
  projectId: "salon-30f7d",
  storageBucket: "salon-30f7d.firebasestorage.app",
  messagingSenderId: "1047039879240",
  appId: "1:1047039879240:web:c3d72f704800ed842c107d",
  measurementId: "G-6H6DF5T9PN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Firestore Database
const db = getFirestore(app);

// Export for use in other files
export { app, auth, db };


window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const isErr = type === 'error' || message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('wrong');
    const bgColor = isErr ? '#FFEBEE' : '#E8FFF3';
    const textColor = isErr ? '#D32F2F' : '#17C666';
    const borderColor = isErr ? '#FFCDD2' : '#A7F3D0';
    const icon = isErr ? 'fa-circle-exclamation' : 'fa-circle-check';
    toast.style.cssText = `background: ${bgColor}; color: ${textColor}; padding: 14px 20px; border-radius: 8px; border: 1px solid ${borderColor}; font-weight: 500; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; transform: translateX(120%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: auto;`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};
