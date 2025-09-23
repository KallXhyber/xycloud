// =================================================================
// KONFIGURASI KONEKSI
// =================================================================
const firebaseConfig = { apiKey: "AIzaSyDt5U2y-YBpqjhTXZIVWT8IHPtQ5HKtNjM", authDomain: "xycloud-website.firebaseapp.com", projectId: "xycloud-website", storageBucket: "xycloud-website.appspot.com", messagingSenderId: "1013045441950", appId: "1:1013045441950:web:8eb35e616c2806c4aa928f" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const SUPABASE_URL = 'https://qvrbqtkuqgiweaeyifns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cmJxdGt1cWdpd2VhZXlpZm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzEzNTgsImV4cCI6MjA3NDE0NzM1OH0.dY9i0-ygzx6TA2fNDcNUzI6Vecbz-s198oLbhfGqnO4';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variabel global
let currentUserData = null;
let dataAdmin = [], dataPC = [], dataAkun = [];

// =================================================================
// FUNGSI INTI & OTENTIKASI
// =================================================================

function renderNavbar(user, userData) {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    let adminLink = (userData && userData.isAdmin === true) ? `<li><a href="admin.html">Panel Admin</a></li>` : '';
    let authAreaHTML = '';
    if (user) {
        authAreaHTML = `<div class="profile-container"><div class="profile-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#c9d1d9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="#c9d1d9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="profile-dropdown"><div class="username">${userData.username || user.email}</div><a href="profile.html">Profil Saya</a><a href="#" id="logout-button">Logout</a></div></div>`;
    } else {
        authAreaHTML = `<a href="login.html" class="btn btn-secondary">Login</a>`;
    }
    navbar.innerHTML = `<div class="container"><a href="index.html" class="brand-logo"><svg class="logo-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 13.5C18.9 13.5 20 12.4 20 11C20 9.6 18.9 8.5 17.5 8.5C17.5 6 15.5 4 13 4C10.8 4 9.1 5.4 8.6 7.3C8.5 7.3 8.3 7.2 8.2 7.2C6.7 7.2 5.5 8.4 5.5 9.9C5.5 11.4 6.7 12.6 8.2 12.6H17.5C17.5 13.5 17.5 13.5 17.5 13.5Z" stroke="#c9d1d9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14 17.5C14.8 17.5 15.5 16.8 15.5 16C15.5 15.2 14.8 14.5 14 14.5C13.2 14.5 12.5 15.2 12.5 16C12.5 16.8 13.2 17.5 14 17.5Z" stroke="#c9d1d9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10.5 19.5C11.3 19.5 12 18.8 12 18C12 17.2 11.3 16.5 10.5 16.5C9.7 16.5 9 17.2 9 18C9 18.8 9.7 19.5 10.5 19.5Z" stroke="#c9d1d9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg><span>Xy Cloud</span></a><ul class="nav-links"><li><a href="index.html">Beranda</a></li>${adminLink}<li><a href="store.html">Toko Akun</a></li><li><a href="kontak.html">Kontak</a></li></ul><div class="nav-buttons"><div id="auth-container">${authAreaHTML}</div><a href="rental.html" class="btn btn-gradient">Pesan Sekarang</a></div></div>`;
    if (user) {
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) { logoutButton.addEventListener('click', e => { e.preventDefault(); auth.signOut(); }); }
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            currentUserData = doc.exists ? { uid: user.uid, ...doc.data() } : null;
            renderNavbar(user, currentUserData || { username: user.email });
            jalankanRenderHalamanSaatIni();
        }, error => {
            console.error("Error mendengarkan data user:", error);
            currentUserData = { uid: user.uid, username: user.email };
            renderNavbar(user, currentUserData);
            jalankanRenderHalamanSaatIni();
        });
    } else {
        currentUserData = null;
        renderNavbar(null, null);
        jalankanRenderHalamanSaatIni();
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const [adminSnapshot, pcSnapshot, accountSnapshot] = await Promise.all([
            db.collection('admins').get(), db.collection('pcs').get(), db.collection('accounts').get()
        ]);
        adminSnapshot.forEach(doc => { dataAdmin.push(doc.data()); });
        pcSnapshot.forEach(doc => { dataPC.push(doc.data()); });
        accountSnapshot.forEach(doc => { dataAkun.push(doc.data()); });
        console.log("Data publik (Admin, PC, Akun) berhasil diambil dari Firebase!");
        jalankanRenderHalamanSaatIni();
    } catch (error) {
        console.error("KRITIS: Gagal mengambil data publik dari Firebase:", error);
    }
    setupLoginPage();
    setupVerificationModal();
});

function jalankanRenderHalamanSaatIni() {
    if (document.getElementById('pc-monitoring-grid')) renderMonitors();
    if (document.getElementById('rental-content')) renderRentalPage();
    if (document.getElementById('contact-list-container')) renderKontakPage();
    if (document.getElementById('store-grid')) renderStoreItems();
    if (document.getElementById('profile-section')) renderProfilePage();
    if (document.getElementById('admin-panel')) renderAdminPanel();
}

function setupLoginPage() {
    const loginFormContainer = document.getElementById('login-form-container');
    if (!loginFormContainer) return;
    const registerFormContainer = document.getElementById('register-form-container');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginFormContainer.style.display = 'none'; registerFormContainer.style.display = 'block'; });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); loginFormContainer.style.display = 'block'; registerFormContainer.style.display = 'none'; });
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                const user = userCredential.user;
                db.collection('users').doc(user.uid).set({
                    username: username, email: email, isVerified: false, verificationUrls: [], isAdmin: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    showToast('Registrasi berhasil!', 'success'); setTimeout(() => window.location.href = 'index.html', 1500);
                });
            }).catch(error => { showToast('Error Registrasi: ' + error.message, 'error'); });
    });
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                showToast('Login berhasil!', 'success'); setTimeout(() => window.location.href = 'index.html', 1500);
            }).catch(error => { showToast('Error Login: ' + error.message, 'error'); });
    });
}

function setupVerificationModal() {
    const modal = document.getElementById('verification-modal');
    if (!modal) return;
    const sendProofBtn = document.getElementById('send-proof-btn');
    const closeButton = modal.querySelector('.close-button');
    const fileInput = document.getElementById('proof-upload');
    const fileNameDisplay = document.getElementById('file-name-display');
    window.openModal = function() { modal.classList.add('active'); }
    function closeModal() { modal.classList.remove('active'); fileInput.value = ''; fileNameDisplay.textContent = 'Pilih 3 File'; }
    fileInput.addEventListener('change', function() { fileNameDisplay.textContent = this.files.length > 0 ? `${this.files.length} file dipilih` : 'Pilih 3 File'; });
    sendProofBtn.addEventListener('click', async function() {
        if (!currentUserData) { showToast('Anda harus login untuk verifikasi!', 'error'); return; }
        const files = fileInput.files;
        if (files.length !== 3) { showToast('Harap pilih dan upload tepat 3 file screenshot.', 'error'); return; }
        this.disabled = true; this.textContent = 'Mengupload... (0/3)';
        try {
            const uploadPromises = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileName = `${currentUserData.uid}_${Date.now()}_${i + 1}_${file.name}`;
                uploadPromises.push(supabaseClient.storage.from('assets').upload(fileName, file));
                this.textContent = `Mengupload... (${i + 1}/3)`;
            }
            const uploadResults = await Promise.all(uploadPromises);
            const firstError = uploadResults.find(res => res.error);
            if (firstError) throw firstError.error;
            const urlPromises = uploadResults.map(result => { const path = result.data.Key || (result.data.path); const fileName = path.split('/').pop(); return supabaseClient.storage.from('assets').getPublicUrl(fileName); });
            const urlResults = await Promise.all(urlPromises);
            const publicURLs = urlResults.map(res => res.data.publicUrl);
            await db.collection('users').doc(currentUserData.uid).update({ isVerified: 'pending', verificationUrls: publicURLs });
            showToast('Bukti berhasil dikirim!', 'success');
            closeModal();
        } catch (error) {
            console.error('Error dalam proses verifikasi:', error);
            showToast('Gagal mengirim bukti. Coba lagi.', 'error');
        } finally {
            this.disabled = false; this.textContent = 'Kirim Bukti untuk Verifikasi';
        }
    });
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => (event.target === modal) && closeModal());
}

function cekStatusAdmin(admin) { const jamSekarang = new Date().getHours(); const { start, end } = admin.jamOperasional; if (start > end) { return jamSekarang >= start || jamSekarang < end; } else { return jamSekarang >= start && jamSekarang < end; } }

function renderMonitors() {
    const grid = document.getElementById('pc-monitoring-grid');
    if (!grid) return;
    grid.innerHTML = '';
    dataPC.slice(0, 3).forEach(pc => {
        const statusItem = document.createElement('div');
        statusItem.className = 'status-item';
        let statusIndicator = '';
        if (pc.status === 'READY') { statusIndicator = `<div class="status-indicator">READY</div>`; }
        else if (pc.status === 'DIGUNAKAN') { statusIndicator = `<div class="status-indicator" style="color: #ffc107;"><span style="background-color: #ffc107;"></span>DIGUNAKAN</div>`; }
        else { statusIndicator = `<div class="status-indicator" style="color: #8b949e;"><span style="background-color: #8b949e;"></span>OFFLINE</div>`; }
        statusItem.innerHTML = `<span>${pc.nama} (${pc.id})</span> ${statusIndicator}`;
        grid.appendChild(statusItem);
    });
}

function renderStoreItems() { const grid = document.getElementById('store-grid'); if (!grid) return; grid.innerHTML = ''; dataAkun.forEach(akun => { const card = document.createElement('div'); card.className = 'card'; card.innerHTML = `<h3>${akun.nama}</h3><p>${akun.deskripsi}</p><p class="price">${akun.harga}</p>`; grid.appendChild(card); }); }

function renderKontakPage() { const container = document.getElementById('contact-list-container'); if (!container) return; container.innerHTML = ''; dataAdmin.forEach(admin => { const isOnline = cekStatusAdmin(admin); const card = document.createElement('div'); card.className = 'card contact-card'; card.innerHTML = `<h3>${admin.nama}</h3><p>Status: <strong>${isOnline ? 'ONLINE' : 'OFFLINE'}</strong></p><a href="https://wa.me/${admin.kontak}" target="_blank" class="btn-kontak">Hubungi via WhatsApp</a>`; container.appendChild(card); }); }

function renderRentalPage() {
    const container = document.getElementById('rental-content');
    if (!container) return;
    if (!currentUserData) {
        container.innerHTML = `<section class="section"><h2>Login untuk Menyewa</h2><p>Anda harus login terlebih dahulu untuk melihat daftar admin dan menyewa PC.</p><a href="login.html" class="btn btn-gradient" style="margin-top:20px;">Login Sekarang</a></section>`;
        return;
    }
    if (currentUserData.isVerified === true) {
        container.innerHTML = `<section class="section"><h2>Pilih Admin & Paket Sewa</h2><div id="admin-list-container"></div></section>`;
        const adminContainer = document.getElementById('admin-list-container');
        adminContainer.innerHTML = '';
        dataAdmin.forEach(admin => {
            const isOnline = cekStatusAdmin(admin); const statusClass = isOnline ? 'online' : 'offline'; const statusText = isOnline ? 'ONLINE' : 'OFFLINE'; let hargaHTML = '<ul class="harga-list">'; admin.harga.forEach(item => { hargaHTML += `<li><span>${item.paket}</span><span>Rp ${item.harga}</span></li>`; }); hargaHTML += '</ul>'; const adminCard = document.createElement('div'); adminCard.className = `admin-card ${statusClass}`; adminCard.innerHTML = `<div class="admin-header"><div class="status-dot ${statusClass}"></div><div class="admin-info"><h3>${admin.nama}</h3><p>${statusText} (Jam: ${String(admin.jamOperasional.start).padStart(2,'0')}:00 - ${String(admin.jamOperasional.end).padStart(2,'0')}:00)</p></div></div>${hargaHTML}${isOnline ? `<button class="btn-kontak sewa-btn">Sewa dari ${admin.nama}</button>` : '<a href="#" class="btn-kontak">Admin Offline</a>'}`; adminContainer.appendChild(adminCard);
        });
        document.querySelectorAll('.sewa-btn').forEach(button => {
            button.addEventListener('click', function() { showToast('Akun terverifikasi! Formulir sewa akhir akan muncul di sini.', 'success'); });
        });
    } else if (currentUserData.isVerified === 'pending') {
        container.innerHTML = `<section class="section"><h2>Verifikasi Anda Sedang Diproses</h2><p>Admin akan segera memeriksa bukti yang Anda kirim. Status akan terupdate otomatis di halaman profil Anda.</p></section>`;
    } else {
        container.innerHTML = `<section class="section"><h2>Akun Belum Terverifikasi</h2><p>Untuk dapat menyewa, Anda harus melakukan verifikasi.</p><button id="start-verification-btn" class="btn btn-gradient" style="margin-top:20px; font-size:1.2rem; padding: 15px 30px;">Mulai Verifikasi</button></section>`;
        document.getElementById('start-verification-btn').addEventListener('click', () => window.openModal());
    }
}

function renderProfilePage() {
    const container = document.getElementById('profile-content');
    if (!container) return;
    if (!currentUserData) { container.innerHTML = '<p>Silakan login untuk melihat profil Anda.</p>'; return; }
    let statusText, statusClass;
    if (currentUserData.isVerified === true) { statusText = 'Terverifikasi'; statusClass = 'status-verified'; } 
    else if (currentUserData.isVerified === 'pending') { statusText = 'Menunggu Konfirmasi'; statusClass = 'status-pending'; } 
    else { statusText = 'Belum Diverifikasi'; statusClass = 'status-unverified'; }
    container.innerHTML = `<div class="profile-info-item"><span>Username</span><span>${currentUserData.username || 'N/A'}</span></div><div class="profile-info-item"><span>Email</span><span>${currentUserData.email}</span></div><div class="profile-info-item"><span>Status Akun</span><span class="${statusClass}">${statusText}</span></div>`;
}

async function renderAdminPanel() {
    const container = document.getElementById('admin-panel');
    if (!container) return;
    if (!currentUserData || !currentUserData.isAdmin) { container.innerHTML = '<h2>Akses Ditolak</h2><p>Hanya admin yang dapat mengakses halaman ini.</p>'; return; }
    container.innerHTML = `<h2>Verifikasi Pengguna</h2><div class="admin-box"><div id="pending-users-table">Memuat pengguna...</div></div>`;
    try {
        const snapshot = await db.collection('users').where('isVerified', '==', 'pending').get();
        const pendingUsersContainer = document.getElementById('pending-users-table');
        if (snapshot.empty) { pendingUsersContainer.innerHTML = '<p>Tidak ada pengguna yang menunggu verifikasi.</p>'; return; }
        let tableHTML = '<table class="admin-table"><thead><tr><th>Username</th><th>Email</th><th>Bukti</th><th>Aksi</th></tr></thead><tbody>';
        snapshot.forEach(doc => {
            const user = { id: doc.id, ...doc.data() };
            let linksHTML = (user.verificationUrls || []).map((url, i) => `<a href="${url}" target="_blank">Bukti ${i+1}</a>`).join(' | ');
            tableHTML += `<tr><td>${user.username}</td><td>${user.email}</td><td>${linksHTML}</td><td><button class="btn-approve" data-userid="${user.id}">Setujui</button><button class="btn-reject" data-userid="${user.id}">Tolak</button></td></tr>`;
        });
        tableHTML += '</tbody></table>';
        pendingUsersContainer.innerHTML = tableHTML;
        document.querySelectorAll('.btn-approve').forEach(btn => btn.addEventListener('click', () => updateUserVerification(btn.dataset.userid, true)));
        document.querySelectorAll('.btn-reject').forEach(btn => btn.addEventListener('click', () => updateUserVerification(btn.dataset.userid, false)));
    } catch(error) {
        console.error("Error mengambil data verifikasi:", error);
        document.getElementById('pending-users-table').innerHTML = '<p>Gagal memuat data.</p>';
    }
}

async function updateUserVerification(userId, isApproved) {
    try {
        await db.collection('users').doc(userId).update({ isVerified: isApproved });
        showToast(`Pengguna berhasil ${isApproved ? 'diverifikasi' : 'ditolak'}.`, 'success');
    } catch(error) {
        showToast('Gagal mengupdate status pengguna.', 'error'); console.error(error);
    }
}
