// File: js/auth.js
// VERSI FINAL: Mengembalikan semua fungsionalitas tombol dan manajemen profil.

import { 
    getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, 
    signInAnonymously, updatePassword 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase-init.js';
import { showToast, showPage } from './ui.js';

const auth = getAuth();
let currentUserData = null; // Menyimpan data user dari Firestore

// Fungsi utama untuk setup semua event listener terkait autentikasi
export function setupAuthEventListeners() {
    // Tombol di Header
    document.getElementById('login-btn-main').addEventListener('click', () => {
        document.getElementById('login-modal').classList.remove('hidden');
    });
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => showToast('Logout berhasil.'));
    });
    document.getElementById('profile-link').addEventListener('click', (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.isAnonymous || !currentUserData) return;

        document.getElementById('profile-email').value = currentUser.email || 'Tidak ada email';
        document.getElementById('profile-displayname').value = currentUser.displayName || '';
        document.getElementById('profile-new-password').value = '';

        const pendapatanContainer = document.getElementById('pendapatan-container');
        if (currentUserData.isAdmin && currentUserData.role === 'reseller') {
            pendapatanContainer.classList.remove('hidden');
            // Logika untuk menghitung pendapatan perlu ditambahkan di sini jika ada
            // calculateAndDisplayIncome(currentUserData.name);
        } else {
            pendapatanContainer.classList.add('hidden');
        }
        showPage('profile');
    });

    // Tombol di dalam Modal Login
    document.getElementById('close-login-modal').addEventListener('click', () => {
        document.getElementById('login-modal').classList.add('hidden');
    });
    document.getElementById('google-login-btn').addEventListener('click', () => {
        signInWithPopup(auth, new GoogleAuthProvider()).then(async (result) => {
            const user = result.user;
            const userDocRef = doc(db, `users/${user.uid}`);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
                await setDoc(userDocRef, { displayName: user.displayName, email: user.email, isAdmin: false, createdAt: serverTimestamp() });
            }
            document.getElementById('login-modal').classList.add('hidden');
            showToast('Login dengan Google berhasil!');
        }).catch(() => showToast('Login Google gagal.', 'error'));
    });
    document.getElementById('login-email-btn').addEventListener('click', () => {
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;
        if (!email || !password) return showToast('Email dan password harus diisi.', 'error');
        
        signInWithEmailAndPassword(auth, email, password).then(() => {
            document.getElementById('login-modal').classList.add('hidden');
            showToast(`Selamat datang kembali!`, 'success');
        }).catch(() => showToast('Login gagal. Periksa kembali email dan password Anda.', 'error'));
    });
    document.getElementById('register-email-btn').addEventListener('click', async () => {
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;
        const displayName = prompt("Masukkan nama tampilan Anda (misal: Budi):");
        if (!email || password.length < 6 || !displayName) return showToast('Email, password (min. 6 karakter), dan nama tampilan harus diisi.', 'error');
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: displayName });
            await setDoc(doc(db, `users/${user.uid}`), { displayName: displayName, email: user.email, isAdmin: false, createdAt: serverTimestamp() });
            document.getElementById('login-modal').classList.add('hidden');
            showToast('Pendaftaran berhasil! Anda sudah login.', 'success');
        } catch (error) {
            showToast(error.code === 'auth/email-already-in-use' ? 'Email ini sudah terdaftar.' : 'Pendaftaran gagal.', 'error');
        }
    });
    document.getElementById('anonymous-login-btn').addEventListener('click', () => {
        signInAnonymously(auth).then(() => {
            document.getElementById('login-modal').classList.add('hidden');
            showToast('Anda login sebagai tamu.', 'info');
        }).catch(() => showToast('Gagal login sebagai tamu.', 'error'));
    });

    // Tombol di Halaman Profil
    document.getElementById('save-profile-btn').addEventListener('click', async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const newDisplayName = document.getElementById('profile-displayname').value;
        const newPassword = document.getElementById('profile-new-password').value;
        let changesMade = false;
        try {
            if (newDisplayName && newDisplayName !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: newDisplayName });
                await updateDoc(doc(db, `users/${currentUser.uid}`), { displayName: newDisplayName });
                changesMade = true;
            }
            if (newPassword) {
                if (newPassword.length >= 6) {
                    await updatePassword(currentUser, newPassword);
                    changesMade = true;
                } else {
                    throw new Error('Password baru harus minimal 6 karakter.');
                }
            }
            showToast(changesMade ? 'Profil berhasil diperbarui!' : 'Tidak ada perubahan.', changesMade ? 'success' : 'info');
            if (changesMade) showPage('home');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

// Fungsi untuk memantau status login dan mengambil data dari Firestore
export function monitorAuthState(updateUICallback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, `users/${user.uid}`);
            const userDoc = await getDoc(userDocRef);
            currentUserData = userDoc.exists() ? { id: user.uid, ...userDoc.data() } : null;
            
            const isAdmin = currentUserData ? currentUserData.isAdmin || false : false;
            const displayName = user.displayName || (user.isAnonymous ? 'Tamu' : 'Pengguna Baru');
            
            updateUICallback(user, isAdmin, displayName);
        } else {
            currentUserData = null;
            updateUICallback(null, false, null);
        }
    });
}

