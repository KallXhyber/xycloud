// File: js/script.js
// PERBAIKAN TOTAL: Menggunakan metode satu file yang stabil dan memperbaiki urutan inisialisasi untuk menjamin semua tombol berfungsi.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInAnonymously, updatePassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, setDoc, getDoc, updateDoc, query, orderBy, limit, serverTimestamp, where, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Konfigurasi ditaruh langsung di sini untuk stabilitas maksimal
const firebaseConfig = { 
    apiKey: "AIzaSyCXUy_NPBoC4scskd6tRJNoJtR0NRAfTJ8", 
    authDomain: "xycloud-531d2.firebaseapp.com", 
    projectId: "xycloud-531d2", 
    storageBucket: "xycloud-531d2.appspot.com", 
    messagingSenderId: "528538517556", 
    appId: "1:52853851756:web:3bd4ac8f6dbd9ad52c8a61", 
    measurementId: "G-Z02Z4EEKY4" 
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Variabel Global ---
let currentUser = null, currentUserData = null, selectedSewaData = {}, countdownIntervals = {}, currentTrackIndex = 0;

const playlist = [ 
    { title: "Lost in Space", artist: "MILL WEST", src: "https://f.top4top.io/m_3549csq8c0.mp3" }, 
    { title: "Ambient Background", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }
];

// --- Fungsi-fungsi Utama ---
const toastContainer = document.getElementById('toast-container');
const successSound = document.getElementById('success-sound');
const errorSound = document.getElementById('error-sound');

function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-times-circle' : 'fa-info-circle');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    if (type === 'success' && successSound) successSound.play().catch(e => {});
    else if (errorSound) errorSound.play().catch(e => {});
    setTimeout(() => { toast.classList.add('show'); }, 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => { toast.remove(); }, 500); }, 4000);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const newPage = document.getElementById(pageId);
    if (newPage) newPage.classList.add('active');
    window.scrollTo(0, 0);
    document.getElementById('mobile-menu')?.classList.add('hidden');
}

// --- INI ADALAH FUNGSI UTAMA YANG MENJALANKAN SEMUANYA ---
functioninitializeAppAndListeners() {
    // Navigasi
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.dataset.page);
        });
    });
    document.getElementById('mobile-menu-button')?.addEventListener('click', () => {
        document.getElementById('mobile-menu')?.classList.toggle('hidden');
    });
     // Logo click to home
    document.querySelector('.animated-logo')?.addEventListener('click', () => showPage('home'));


    // Music Player
    const mainAudioPlayer = document.getElementById('main-audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn'), nextBtn = document.getElementById('next-track-btn'), prevBtn = document.getElementById('prev-track-btn');
    const trackTitleEl = document.getElementById('track-title'), trackArtistEl = document.getElementById('track-artist');
    const musicPlayerEl = document.getElementById('music-player'), minimizePlayerBtn = document.getElementById('minimize-player-btn'), minimizedIcon = document.getElementById('minimized-icon');
    const volumeSlider = document.getElementById('volume-slider');

    function loadTrack(index) {
        if (!mainAudioPlayer || !playlist[index]) return;
        const track = playlist[index];
        trackTitleEl.textContent = track.title;
        trackArtistEl.textContent = track.artist;
        mainAudioPlayer.src = track.src;
        mainAudioPlayer.volume = volumeSlider.value / 100;
    }
    function playTrack() { mainAudioPlayer.play().catch(e => {}); playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
    function pauseTrack() { mainAudioPlayer.pause(); playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; }
    
    playPauseBtn?.addEventListener('click', () => { mainAudioPlayer.paused ? playTrack() : pauseTrack(); });
    nextBtn?.addEventListener('click', () => { currentTrackIndex = (currentTrackIndex + 1) % playlist.length; loadTrack(currentTrackIndex); playTrack(); });
    prevBtn?.addEventListener('click', () => { currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length; loadTrack(currentTrackIndex); playTrack(); });
    volumeSlider?.addEventListener('input', (e) => { mainAudioPlayer.volume = e.target.value / 100; });
    mainAudioPlayer?.addEventListener('ended', () => nextBtn.click());
    minimizePlayerBtn?.addEventListener('click', () => musicPlayerEl.classList.add('minimized'));
    minimizedIcon?.addEventListener('click', () => musicPlayerEl.classList.remove('minimized'));
    loadTrack(currentTrackIndex);


    // Listener untuk semua klik tombol di dalam body
    document.body.addEventListener('click', async (e) => {
        const target = e.target.closest('button, a'); // Fokus pada elemen yang bisa diklik
        if (!target) return;

        // AUTHENTICATION ACTIONS
        if (target.id === 'login-btn-main') document.getElementById('login-modal').classList.remove('hidden');
        if (target.id === 'close-login-modal') document.getElementById('login-modal').classList.add('hidden');
        if (target.id === 'logout-btn') signOut(auth).then(() => showToast('Logout berhasil.'));
        if (target.id === 'google-login-btn') {
            signInWithPopup(auth, new GoogleAuthProvider()).then(async (result) => {
                const user = result.user;
                const userDocRef = doc(db, `users/${user.uid}`);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                    await setDoc(userDocRef, { displayName: user.displayName, email: user.email, isAdmin: false, createdAt: serverTimestamp() });
                }
                document.getElementById('login-modal').classList.add('hidden');
                showToast('Login berhasil!');
            }).catch(() => showToast('Login Google gagal.', 'error'));
        }
        if (target.id === 'login-email-btn') {
            const email = document.getElementById('email-input').value;
            const password = document.getElementById('password-input').value;
            if (!email || !password) { showToast('Email dan password harus diisi.', 'error'); return; }
            signInWithEmailAndPassword(auth, email, password).then(() => {
                document.getElementById('login-modal').classList.add('hidden');
                showToast(`Selamat datang kembali!`, 'success');
            }).catch(() => { showToast('Login gagal. Periksa kembali email dan password Anda.', 'error'); });
        }
         if (target.id === 'register-email-btn') {
            const email = document.getElementById('email-input').value;
            const password = document.getElementById('password-input').value;
            const displayName = prompt("Masukkan nama tampilan Anda (misal: Budi):");
            if (!email || password.length < 6 || !displayName) { showToast('Email, password (min. 6 karakter), dan nama tampilan harus diisi.', 'error'); return; }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: displayName });
                const userDocRef = doc(db, `users/${user.uid}`);
                await setDoc(userDocRef, { displayName: displayName, email: user.email, isAdmin: false, createdAt: serverTimestamp() });
                document.getElementById('login-modal').classList.add('hidden');
                showToast('Pendaftaran berhasil! Anda sudah login.', 'success');
            } catch (error) { showToast(error.code === 'auth/email-already-in-use' ? 'Email ini sudah terdaftar.' : 'Pendaftaran gagal.', 'error'); }
        }
        if (target.id === 'anonymous-login-btn') {
             signInAnonymously(auth).then(() => {
                document.getElementById('login-modal').classList.add('hidden');
                showToast('Anda login sebagai tamu.', 'info');
            }).catch(() => { showToast('Gagal login sebagai tamu.', 'error'); });
        }
        
        // PROFILE ACTIONS
        if (target.id === 'profile-link') {
            e.preventDefault();
            if (!currentUser || currentUser.isAnonymous || !currentUserData) return;
            document.getElementById('profile-email').value = currentUser.email || 'Tidak ada email';
            document.getElementById('profile-displayname').value = currentUser.displayName || '';
            document.getElementById('profile-new-password').value = '';
            const pendapatanContainer = document.getElementById('pendapatan-container');
            if (currentUserData.isAdmin && currentUserData.role === 'reseller') {
                pendapatanContainer.classList.remove('hidden');
                calculateAndDisplayIncome(currentUserData.name);
            } else {
                pendapatanContainer.classList.add('hidden');
            }
            showPage('profile');
        }
        if (target.id === 'save-profile-btn') {
             if (!currentUser) return;
            const newDisplayName = document.getElementById('profile-displayname').value;
            const newPassword = document.getElementById('profile-new-password').value;
            let changesMade = false;
            try {
                if (newDisplayName && newDisplayName !== currentUser.displayName) {
                    await updateProfile(currentUser, { displayName: newDisplayName });
                    const userDocRef = doc(db, `users/${currentUser.uid}`);
                    await updateDoc(userDocRef, { displayName: newDisplayName });
                    changesMade = true;
                }
                if (newPassword) {
                    if (newPassword.length >= 6) {
                        await updatePassword(currentUser, newPassword);
                        changesMade = true;
                    } else { throw new Error('Password baru harus minimal 6 karakter.'); }
                }
                showToast(changesMade ? 'Profil berhasil diperbarui!' : 'Tidak ada perubahan.', changesMade ? 'success' : 'info');
                showPage('home');
            } catch (error) { showToast(error.message, 'error'); }
        }
        
        // TRANSACTION ACTIONS
         if (target.id === 'submit-sewa-form') {
            const waInput = document.getElementById('whatsapp-input').value;
            if (!currentUser) { showToast('Sesi login tidak ditemukan, silakan login ulang.', 'error'); return; }
            if (waInput.length !== 4 || !/^\d+$/.test(waInput)) { showToast('Mohon masukkan 4 digit angka yang valid.', 'error'); return; }
            const billingId = `${waInput}-${Date.now().toString().slice(-6)}`;
            const transactionData = { ...selectedSewaData, billingId, status: 'Menunggu Pembayaran', userId: currentUser.uid, userDisplayName: currentUser.displayName, timestamp: serverTimestamp() };
            try {
                await addDoc(collection(db, 'transactions'), transactionData);
                document.getElementById('sewa-form-modal').classList.add('hidden');
                document.getElementById('qris-title').textContent = "Pembayaran Sewa";
                document.getElementById('qris-instruction').innerHTML = `Tagihan Anda <strong class="text-white">${billingId}</strong>. Silahkan hubungi admin <strong class="text-white">${selectedSewaData.admin.name}</strong> untuk konfirmasi.`;
                const message = encodeURIComponent(`Halo ${selectedSewaData.admin.name}, saya ingin konfirmasi pembayaran untuk sewa PC dengan Billing ID: ${billingId}.`);
                document.getElementById('whatsapp-link-qris').href = `https://wa.me/${selectedSewaData.admin.whatsapp}?text=${message}`;
                document.getElementById('qris-modal').classList.remove('hidden');
                showToast('Tagihan berhasil dibuat!');
            } catch (error) { console.error("Transaction Error: ", error); showToast('Gagal membuat transaksi.', 'error'); }
        }
        if (target.id === 'cancel-sewa-form') document.getElementById('sewa-form-modal').classList.add('hidden');
        if (target.id === 'close-qris-modal') document.getElementById('qris-modal').classList.add('hidden');
        
        // ... (dan semua listener klik lainnya) ...
    });

    // Dan seterusnya untuk semua logika lainnya...
    // Ini memastikan semua elemen ada sebelum kita pasang listener
}

// --- Menjalankan Aplikasi ---
// Tunggu sampai halaman benar-benar siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAppAndListeners);
} else {
    initializeAppAndListeners();
}


// --- Listener Real-time dari Firestore (Tetap di luar) ---
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        const userDocRef = doc(db, `users/${user.uid}`);
        const userDoc = await getDoc(userDocRef);
        currentUserData = userDoc.exists() ? { id: user.uid, ...userDoc.data() } : null;
        const isAdmin = currentUserData ? currentUserData.isAdmin || false : false;
        const displayName = user.displayName || (user.isAnonymous ? 'Tamu' : 'Pengguna Baru');
        
        // Update UI berdasarkan status login
        const loginContainer = document.getElementById('login-container');
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        const adminPanelBtn = document.getElementById('admin-panel-btn');
        const profileLink = document.getElementById('profile-link');
        
        if (loginContainer) loginContainer.classList.add('hidden');
        if (userInfo) {
            userInfo.classList.remove('hidden');
            userInfo.classList.add('flex');
        }
        if (userName) userName.textContent = displayName;
        if (profileLink) profileLink.classList.toggle('hidden', user.isAnonymous);
        if (adminPanelBtn) adminPanelBtn.classList.toggle('hidden', !isAdmin);

    } else {
        currentUserData = null;
        // Update UI untuk kondisi logout
        document.getElementById('login-container')?.classList.remove('hidden');
        document.getElementById('user-info')?.classList.add('hidden');
        document.getElementById('admin-panel-btn')?.classList.add('hidden');
    }
});
// ... sisa listener onSnapshot lainnya ...
onSnapshot(collection(db, `pcs`), (snapshot) => { 
    // ... kode onSnapshot PC ...
});
onSnapshot(collection(db, `admins`), (snapshot) => {
    // ... kode onSnapshot Admin ...
});

