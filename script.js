import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInAnonymously, updatePassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, setDoc, getDoc, updateDoc, query, orderBy, limit, serverTimestamp, where, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
function formatDetikKeWaktu(totalDetik) {
    if (isNaN(totalDetik) || totalDetik <= 0) {
        return "0 Jam 0 Menit";
    }
    const jam = Math.floor(totalDetik / 3600);
    const sisaDetik = totalDetik % 3600;
    const menit = Math.floor(sisaDetik / 60);
    return `${jam} Jam ${menit} Menit`;
}

const firebaseConfig = { apiKey: "AIzaSyCXUy_NPBoC4scskd6tRJNoJtR0NRAfTJ8", authDomain: "xycloud-531d2.firebaseapp.com", projectId: "xycloud-531d2", storageBucket: "xycloud-531d2.appspot.com", messagingSenderId: "528538517556", appId: "1:52853851756:web:3bd4ac8f6dbd9ad52c8a61", measurementId: "G-Z02Z4EEKY4" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null, currentUserData = null, selectedSewaData = {}, countdownIntervals = {}, currentTrackIndex = 0;

const playlist = [ 
    { title: "Garam & Madu", artist: "Tenxi", src: "https://g.top4top.io/m_3550tbjv31.mp3" }, 
    { title: "Jarang pulang", artist: "Lina lady geboy", src: "https://j.top4top.io/m_3550yryj20.mp3" }
];

const toastContainer = document.getElementById('toast-container');
const successSound = document.getElementById('success-sound');
const errorSound = document.getElementById('error-sound');
const infoSound = document.getElementById('info-sound');
if(successSound) successSound.volume = 0.5; 
if(errorSound) errorSound.volume = 0.5;
if(infoSound) infoSound.volume = 0.5;

function showToast(message, type = 'success') { 
    const toast = document.createElement('div'); 
    const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-times-circle' : 'fa-info-circle'); 
    toast.className = `toast toast-${type}`; 
    toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`; 
    toastContainer.appendChild(toast); 
    
    if (type === 'success' && successSound) {
        successSound.play().catch(e => {}); 
    } else if (type === 'info' && infoSound) {
        infoSound.play().catch(e => {});
    } else if (errorSound) {
        errorSound.play().catch(e => {}); 
    }

    setTimeout(() => { toast.classList.add('show'); }, 100); 
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => { toast.remove(); }, 500); }, 4000); 
}

const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const animatedLogo = document.querySelector('.animated-logo');

function showPage(pageId) { 
    pages.forEach(page => page.classList.remove('active')); 
    const newPage = document.getElementById(pageId); 
    if (newPage) newPage.classList.add('active'); 
    window.scrollTo(0, 0); 
    if(mobileMenu) mobileMenu.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); showPage(link.dataset.page); }); });
    if(mobileMenuButton) mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    if(animatedLogo) animatedLogo.addEventListener('click', () => showPage('home'));

    const mainAudioPlayer = document.getElementById('main-audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn'), nextBtn = document.getElementById('next-track-btn'), prevBtn = document.getElementById('prev-track-btn');
    const trackTitleEl = document.getElementById('track-title'), trackArtistEl = document.getElementById('track-artist');
    const musicPlayerEl = document.getElementById('music-player'), minimizePlayerBtn = document.getElementById('minimize-player-btn'), minimizedIcon = document.getElementById('minimized-icon');
    const volumeSlider = document.getElementById('volume-slider');
    function loadTrack(index) { const track = playlist[index]; trackTitleEl.textContent = track.title; trackArtistEl.textContent = track.artist; mainAudioPlayer.src = track.src; mainAudioPlayer.volume = volumeSlider.value / 100; }
    function playTrack() { mainAudioPlayer.play().catch(e => {}); playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
    function pauseTrack() { mainAudioPlayer.pause(); playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; }
    playPauseBtn.addEventListener('click', () => { mainAudioPlayer.paused ? playTrack() : pauseTrack(); });
    nextBtn.addEventListener('click', () => { currentTrackIndex = (currentTrackIndex + 1) % playlist.length; loadTrack(currentTrackIndex); playTrack(); });
    prevBtn.addEventListener('click', () => { currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length; loadTrack(currentTrackIndex); playTrack(); });
    volumeSlider.addEventListener('input', (e) => { mainAudioPlayer.volume = e.target.value / 100; });
    mainAudioPlayer.addEventListener('ended', () => nextBtn.click());
    minimizePlayerBtn.addEventListener('click', () => musicPlayerEl.classList.add('minimized'));
    minimizedIcon.addEventListener('click', () => musicPlayerEl.classList.remove('minimized'));
    loadTrack(currentTrackIndex);
    
    function updateUIForAuthState(user, isAdmin, displayName) { 
        const loginContainer = document.getElementById('login-container'); 
        const userInfo = document.getElementById('user-info'); 
        const userName = document.getElementById('user-name'); 
        const adminPanelBtn = document.getElementById('admin-panel-btn'); 
        const profileLink = document.getElementById('profile-link'); 
        if (user) { 
            loginContainer.classList.add('hidden'); 
            userInfo.classList.remove('hidden'); 
            userInfo.classList.add('flex'); 
            userName.textContent = displayName; 
            profileLink.classList.toggle('hidden', user.isAnonymous); 
            adminPanelBtn.classList.toggle('hidden', !isAdmin); 
        } else { 
            loginContainer.classList.remove('hidden'); 
            userInfo.classList.add('hidden'); 
            adminPanelBtn.classList.add('hidden'); 
        } 
    }
    
    onAuthStateChanged(auth, async (user) => { 
        currentUser = user; 
        if (user) { 
            const userDocRef = doc(db, `users/${user.uid}`); 
            const userDoc = await getDoc(userDocRef); 
            currentUserData = userDoc.exists() ? { id: user.uid, ...userDoc.data() } : null; 
            let userData = { 
                displayName: user.displayName || (user.isAnonymous ? 'Tamu' : 'Pengguna Baru'), 
                email: user.email, 
                isAdmin: currentUserData ? currentUserData.isAdmin || false : false,
                role: currentUserData ? currentUserData.role || 'user' : 'user',
                name: currentUserData ? currentUserData.name || '' : ''
            }; 
            currentUserData = {...currentUserData, ...userData};
            updateUIForAuthState(user, userData.isAdmin, userData.displayName); 
        } else { 
            currentUserData = null; 
            updateUIForAuthState(null, false, null); 
        } 
    });

    function renderHargaList(admin) { 
        const hargaContainer = document.getElementById('harga-list-container'); 
        const hargaListDiv = document.getElementById('harga-list'); 
        const selectedAdminName = document.getElementById('selected-admin-name'); 
        selectedAdminName.textContent = `(${admin.name})`; 
        hargaListDiv.innerHTML = ''; 
        const prices = admin.prices || {}; 
        const allPrices = [...(prices.perJam || []), ...(prices.paketSiangMalam || []), ...(prices.paketSimpanWaktu || [])]; 
        allPrices.forEach(paket => { 
            if (paket.bisaKustom) { 
                hargaListDiv.innerHTML += `<div class="backdrop-blur-custom p-6 rounded-lg shadow-lg flex flex-col col-span-1 md:col-span-2"><h4 class="text-xl font-bold text-white">${paket.nama}</h4><p class="text-lg font-medium my-2 text-white">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paket.harga)} / jam</p><div class="flex items-center gap-4 mt-4"><input type="number" min="1" value="1" class="kustom-jam-input w-20 bg-white/10 text-center font-bold text-white rounded-md p-2" data-harga-per-jam="${paket.harga}"><span>Jam</span><span class="total-harga-display text-2xl font-bold text-white flex-grow text-right">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paket.harga)}</span></div><button class="mt-4 w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 sewa-kustom-btn" data-paket-nama="${paket.nama}" data-harga-per-jam="${paket.harga}" data-admin-id="${admin.id}" data-admin-name="${admin.name}" data-admin-whatsapp="${admin.whatsapp}">Sewa Kustom</button></div>`; 
            } else { 
                hargaListDiv.innerHTML += `<div class="backdrop-blur-custom p-6 rounded-lg shadow-lg flex flex-col"><h4 class="text-xl font-bold text-white">${paket.nama}</h4><p class="text-3xl font-bold my-4 text-white">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paket.harga)}</p><button class="mt-auto w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 sewa-paket-btn" data-paket-nama="${paket.nama}" data-paket-harga="${paket.harga}" data-paket-durasi="${paket.durasi}" data-admin-id="${admin.id}" data-admin-name="${admin.name}" data-admin-whatsapp="${admin.whatsapp}">Pilih Paket</button></div>`; 
            } 
        }); 
        hargaContainer.classList.remove('hidden'); 
    }
    
    function calculateAndDisplayIncome(adminName) { 
        const incomeDisplay = document.getElementById('total-pendapatan'); 
        const q = query(collection(db, 'usageLogs'), where('adminName', '==', adminName)); 
        onSnapshot(q, (snapshot) => { 
            let totalPendapatan = 0; 
            snapshot.forEach(doc => { totalPendapatan += doc.data().keuntungan || 0; }); 
            incomeDisplay.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPendapatan); 
        }); 
    }
    
    async function renderAdminView() {
        const adminPcControls = document.getElementById('admin-pc-controls');
        onSnapshot(collection(db, 'pcs'), (snapshot) => { adminPcControls.innerHTML = ''; const pcs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(pc => pc.name).sort((a,b) => a.name.localeCompare(b.name)); pcs.forEach(pc => { let timerControlHTML = ''; if (pc.status === 'DIGUNAKAN') { timerControlHTML = `<div class="flex items-center gap-2 mt-2"><input type="number" placeholder="Menit" class="w-20 bg-white/10 text-white rounded p-1 text-center pc-timer-input"><button class="bg-blue-600 text-white px-2 py-1 rounded text-sm set-waktu-btn" data-id="${pc.id}">Set Waktu</button></div>`; } adminPcControls.innerHTML += `<div class="backdrop-blur-custom p-3 rounded-md"><div class="flex items-center justify-between"><span class="font-bold text-white">${pc.name}</span><select class="pc-status-select bg-black/30 text-white rounded p-1" data-id="${pc.id}"><option value="READY" ${pc.status === 'READY' ? 'selected' : ''}>Ready</option><option value="DIGUNAKAN" ${pc.status === 'DIGUNAKAN' ? 'selected' : ''}>Digunakan</option><option value="OFFLINE" ${pc.status === 'OFFLINE' ? 'selected' : ''}>Offline</option></select></div>${timerControlHTML}</div>`; }); });
        const adminTransaksiList = document.getElementById('admin-transaksi-list');
        const transQuery = query(collection(db, 'transactions'), orderBy("timestamp", "desc"), limit(20));
        onSnapshot(transQuery, (snapshot) => { adminTransaksiList.innerHTML = ''; if (snapshot.empty) { adminTransaksiList.innerHTML = '<p class="text-center text-gray-300">Belum ada transaksi.</p>'; return; } snapshot.forEach(doc => { const trx = { id: doc.id, ...doc.data() }; adminTransaksiList.innerHTML += `<div class="backdrop-blur-custom p-3 rounded-md"><p class="text-white"><strong>ID:</strong> ${trx.billingId} (${trx.userDisplayName})</p><p class="text-white"><strong>Item:</strong> ${trx.paket?.nama || 'N/A'}</p><select class="trx-status-select bg-black/30 text-white rounded p-1 mt-2 w-full" data-id="${trx.id}" data-trx='${JSON.stringify(trx)}'><option value="Menunggu Pembayaran" ${trx.status === 'Menunggu Pembayaran' ? 'selected' : ''}>Menunggu</option><option value="Selesai" ${trx.status === 'Selesai' ? 'selected' : ''}>Selesai</option></select></div>`; }); });
        const adminStatusControls = document.getElementById('admin-status-controls');
        onSnapshot(collection(db, 'admins'), (snapshot) => { adminStatusControls.innerHTML = ''; const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(admin => admin.name).sort((a,b) => a.name.localeCompare(b.name)); admins.forEach(admin => { adminStatusControls.innerHTML += `<div class="flex items-center space-x-2"><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" value="" class="sr-only peer admin-online-toggle" data-id="${admin.id}" ${admin.isOnline ? 'checked' : ''}><div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div></label><span class="font-bold text-white">${admin.name}</span></div>`; }); });
    }
    
    document.body.addEventListener('change', async (e) => {
        if (e.target.classList.contains('pc-status-select')) { const pcId = e.target.dataset.id; const newStatus = e.target.value; try { await updateDoc(doc(db, 'pcs', pcId), { status: newStatus, endTime: null }); showToast(`Status PC berhasil diubah`, 'success'); } catch (err) { showToast('Gagal mengubah status PC.', 'error'); } }
        if (e.target.classList.contains('trx-status-select')) { const trxId = e.target.dataset.id; const newStatus = e.target.value; try { const trxData = JSON.parse(e.target.dataset.trx); await updateDoc(doc(db, 'transactions', trxId), { status: newStatus }); if (newStatus === 'Selesai' && trxData.admin?.role === 'reseller') { await addDoc(collection(db, 'usageLogs'), { adminName: trxData.admin.name, keuntungan: trxData.keuntungan, paketNama: trxData.paket.nama, userDisplayName: trxData.userDisplayName, timestamp: serverTimestamp() }); } showToast(`Status transaksi berhasil diubah`, 'success'); } catch (err) { showToast('Gagal mengubah status.', 'error'); } }
        if (e.target.classList.contains('admin-online-toggle')) { const adminId = e.target.dataset.id; const isOnline = e.target.checked; try { await updateDoc(doc(db, 'admins', adminId), { isOnline: isOnline }); showToast(`Status admin berhasil diubah`, 'success'); } catch (err) { showToast('Gagal mengubah status admin.', 'error'); } }
    });

    document.body.addEventListener('input', (e) => { 
        if (e.target.classList.contains('kustom-jam-input')) { 
            const input = e.target; 
            const hargaPerJam = parseInt(input.dataset.hargaPerJam); 
            const jumlahJam = parseInt(input.value) || 1; 
            if (jumlahJam < 1) { input.value = 1; return; } 
            const totalHarga = hargaPerJam * jumlahJam; 
            const container = input.closest('.flex.items-center.gap-4'); 
            const display = container.querySelector('.total-harga-display'); 
            display.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalHarga); 
        } 
    });
    
    document.body.addEventListener('click', async (e) => { 
        const target = e.target.closest('button, a');
        if(!target) return;

        if (target.id === 'beli-akun-btn') { 
            const user = auth.currentUser;
            if (!user || user.isAnonymous) { document.getElementById('login-modal').classList.remove('hidden'); return; } 
            document.getElementById('qris-title').textContent = "Beli Akun Rockstar"; 
            const billingId = user.uid.slice(0, 4).toUpperCase();
            const waMessage = encodeURIComponent(`Halo, saya ingin konfirmasi pembayaran untuk pembelian Akun Rockstar dengan ID: ${billingId}`); 
            document.getElementById('qris-instruction').innerHTML = `Tagihan Anda <strong class="text-white">${billingId}</strong>. Silahkan hubungi admin untuk konfirmasi.`; 
            document.getElementById('whatsapp-link-qris').href = `https://wa.me/6283116632566?text=${waMessage}`; 
            document.getElementById('qris-modal').classList.remove('hidden'); 
        } 
        if (target.classList.contains('sewa-paket-btn') || target.classList.contains('sewa-kustom-btn')) { 
            const user = auth.currentUser;
            if (!user || user.isAnonymous) { document.getElementById('login-modal').classList.remove('hidden'); return; } 
            const isKustom = target.classList.contains('sewa-kustom-btn'); 
            const btn = target; 
            let paketData; 
            if (isKustom) { 
                const container = btn.closest('.backdrop-blur-custom'); 
                const inputJam = container.querySelector('.kustom-jam-input'); 
                const jumlahJam = parseInt(inputJam.value) || 1; 
                const hargaPerJam = parseInt(btn.dataset.hargaPerJam); 
                const totalHarga = jumlahJam * hargaPerJam; 
                paketData = { nama: `${jumlahJam} Jam (Kustom)`, harga: totalHarga, durasi: jumlahJam * 60, hargaDasar: (btn.dataset.hargaDasar || hargaPerJam) * jumlahJam }; 
            } else { 
                paketData = { nama: btn.dataset.paketNama, harga: parseInt(btn.dataset.paketHarga), durasi: parseInt(btn.dataset.paketDurasi), hargaDasar: parseInt(btn.dataset.hargaDasar) || 0 }; 
            } 
            const adminData = { id: btn.dataset.adminId, name: btn.dataset.adminName, whatsapp: btn.dataset.adminWhatsapp, role: btn.dataset.adminRole }; 
            selectedSewaData = { paket: paketData, admin: adminData, keuntungan: paketData.harga - paketData.hargaDasar }; 
            document.getElementById('whatsapp-input').value = ''; 
            document.getElementById('sewa-form-modal').classList.remove('hidden'); 
        } 
        if (target.classList.contains('set-waktu-btn')) { 
            const pcId = target.dataset.id; 
            const container = target.closest('.backdrop-blur-custom'); 
            const input = container.querySelector('.pc-timer-input'); 
            const minutes = parseInt(input.value); 
            if (!minutes || minutes <= 0) { showToast('Masukkan jumlah menit yang valid.', 'error'); return; } 
            const endTime = new Date(Date.now() + minutes * 60 * 1000); 
            try { 
                await updateDoc(doc(db, 'pcs', pcId), { endTime: endTime }); 
                showToast(`Timer untuk ${minutes} menit berhasil diatur!`, 'success'); 
                input.value = ''; 
            } catch (err) { 
                showToast('Gagal mengatur timer.', 'error'); 
            } 
        } 
    });

    document.getElementById('register-email-btn').addEventListener('click', async () => { const email = document.getElementById('email-input').value; const password = document.getElementById('password-input').value; const displayName = prompt("Masukkan nama tampilan Anda (misal: Budi):"); if (!email || password.length < 6 || !displayName) { showToast('Email, password (min. 6 karakter), dan nama tampilan harus diisi.', 'error'); return; } try { const userCredential = await createUserWithEmailAndPassword(auth, email, password); const user = userCredential.user; await updateProfile(user, { displayName: displayName }); const userDocRef = doc(db, `users/${user.uid}`); await setDoc(userDocRef, { displayName: displayName, email: user.email, isAdmin: false, createdAt: serverTimestamp() }); document.getElementById('login-modal').classList.add('hidden'); showToast('Pendaftaran berhasil! Anda sudah login.', 'success'); } catch (error) { showToast(error.code === 'auth/email-already-in-use' ? 'Email ini sudah terdaftar.' : 'Pendaftaran gagal.', 'error'); } });
    document.getElementById('profile-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.isAnonymous || !currentUserData) return;

    // Mengisi data profil (kode ini tetap sama)
    document.getElementById('profile-email').value = currentUser.email || 'Tidak ada email';
    document.getElementById('profile-displayname').value = currentUser.displayName || '';
    document.getElementById('profile-new-password').value = '';

    // Mengambil elemen-elemen dari HTML
    const pendapatanContainer = document.getElementById('pendapatan-container');
    const sisaWaktuContainer = document.getElementById('sisa-waktu-container');
    const sisaWaktuDisplay = document.getElementById('sisa-waktu-display');

    // LOGIKA BARU: Menampilkan sisa waktu
    if (currentUserData.sisaWaktuDetik && currentUserData.sisaWaktuDetik > 0) {
        // Panggil fungsi format waktu yang tadi kita buat
        sisaWaktuDisplay.textContent = formatDetikKeWaktu(currentUserData.sisaWaktuDetik);
        sisaWaktuContainer.classList.remove('hidden'); // Tampilkan wadah sisa waktu
    } else {
        sisaWaktuContainer.classList.add('hidden'); // Sembunyikan jika tidak ada sisa waktu
    }
    
    // Logika untuk pendapatan reseller (kode ini tetap sama)
    if (currentUserData.isAdmin && currentUserData.role === 'reseller') {
        pendapatanContainer.classList.remove('hidden');
        calculateAndDisplayIncome(currentUserData.name);
    } else {
        pendapatanContainer.classList.add('hidden');
    }
    
    showPage('profile');
});
    document.getElementById('save-profile-btn').addEventListener('click', async () => { if (!currentUser) return; const newDisplayName = document.getElementById('profile-displayname').value; const newPassword = document.getElementById('profile-new-password').value; let changesMade = false; try { if (newDisplayName && newDisplayName !== currentUser.displayName) { await updateProfile(currentUser, { displayName: newDisplayName }); const userDocRef = doc(db, `users/${currentUser.uid}`); await updateDoc(userDocRef, { displayName: newDisplayName }); changesMade = true; } if (newPassword) { if (newPassword.length >= 6) { await updatePassword(currentUser, newPassword); changesMade = true; } else { throw new Error('Password baru harus minimal 6 karakter.'); } } showToast(changesMade ? 'Profil berhasil diperbarui!' : 'Tidak ada perubahan.', changesMade ? 'success' : 'info'); showPage('home'); } catch (error) { showToast(error.message, 'error'); } });
    document.getElementById('login-btn-main').addEventListener('click', () => document.getElementById('login-modal').classList.remove('hidden'));
    document.getElementById('close-login-modal').addEventListener('click', () => document.getElementById('login-modal').classList.add('hidden'));
    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth).then(() => showToast('Logout berhasil.')));
    document.getElementById('google-login-btn').addEventListener('click', () => { signInWithPopup(auth, new GoogleAuthProvider()).then(async (result) => { const user = result.user; const userDocRef = doc(db, `users/${user.uid}`); const userDoc = await getDoc(userDocRef); if (!userDoc.exists()) { await setDoc(userDocRef, { displayName: user.displayName, email: user.email, isAdmin: false, createdAt: serverTimestamp() }); } document.getElementById('login-modal').classList.add('hidden'); showToast('Login berhasil!'); }).catch(() => showToast('Login Google gagal.', 'error')); });
    document.getElementById('login-email-btn').addEventListener('click', () => { const email = document.getElementById('email-input').value; const password = document.getElementById('password-input').value; if (!email || !password) { showToast('Email dan password harus diisi.', 'error'); return; } signInWithEmailAndPassword(auth, email, password).then(() => { document.getElementById('login-modal').classList.add('hidden'); showToast(`Selamat datang kembali!`, 'success'); }).catch(() => { showToast('Login gagal. Periksa kembali email dan password Anda.', 'error'); }); });
    document.getElementById('anonymous-login-btn').addEventListener('click', () => { signInAnonymously(auth).then(() => { document.getElementById('login-modal').classList.add('hidden'); showToast('Anda login sebagai tamu.', 'info'); }).catch(() => { showToast('Gagal login sebagai tamu.', 'error'); }); });
    document.getElementById('admin-panel-btn').addEventListener('click', () => { showPage('admin-panel'); renderAdminView(); });
    document.getElementById('cancel-sewa-form').addEventListener('click', () => document.getElementById('sewa-form-modal').classList.add('hidden'));
    
    document.getElementById('submit-sewa-form').addEventListener('click', () => {
        const waInput = document.getElementById('whatsapp-input').value;
        if (waInput.length !== 4 || !/^\d+$/.test(waInput)) { showToast('Mohon masukkan 4 digit angka yang valid.', 'error'); return; }
        const user = auth.currentUser;
        if (!user) { showToast('Gagal: Sesi pengguna tidak ditemukan. Silakan login ulang.', 'error'); return; }
        
        const billingId = waInput; 
        const paketInfo = selectedSewaData.paket.nama;
        const adminInfo = selectedSewaData.admin.name;
        
        let adminWhatsapp = selectedSewaData.admin.whatsapp.replace(/\D/g, ''); 
        if (adminWhatsapp.startsWith('0')) {
            adminWhatsapp = '62' + adminWhatsapp.substring(1);
        }

        const message = encodeURIComponent(`Halo Admin ${adminInfo},\n\nSaya ingin sewa PC:\n- Pengguna: ${user.displayName}\n- Paket: ${paketInfo}\n- Billing ID: ${billingId}\n\nMohon konfirmasinya.`);

        document.getElementById('sewa-form-modal').classList.add('hidden');
        document.getElementById('qris-instruction').innerHTML = `Billing ID Anda <strong class="text-white">${billingId}</strong>. Kirim pesan ke admin <strong class="text-white">${adminInfo}</strong> untuk melanjutkan.`;
        document.getElementById('whatsapp-link-qris').href = `https://wa.me/${adminWhatsapp}?text=${message}`;
        document.getElementById('qris-modal').classList.remove('hidden');
        showToast('Silahkan kirim pesan konfirmasi!', 'info');
    });

    document.getElementById('submit-manual-transaction').addEventListener('click', async () => {
        const billingId = document.getElementById('manual-billing-id').value;
        const userName = document.getElementById('manual-user-name').value;
        const paketName = document.getElementById('manual-paket-name').value;

        if (!billingId || !userName || !paketName) { showToast('Semua kolom harus diisi.', 'error'); return; }

        const transactionData = {
            billingId: billingId,
            userDisplayName: userName,
            paket: { nama: paketName },
            status: "Selesai",
            timestamp: serverTimestamp(),
            adminName: currentUserData?.name || "Admin",
        };

        try {
            await addDoc(collection(db, 'transactions'), transactionData);
            showToast('Transaksi berhasil dibuat!', 'success');
            document.getElementById('manual-billing-id').value = '';
            document.getElementById('manual-user-name').value = '';
            document.getElementById('manual-paket-name').value = '';
        } catch (error) {
            console.error("Manual Transaction Error:", error);
            showToast('Gagal menyimpan transaksi.', 'error');
        }
    });

    document.getElementById('close-qris-modal').addEventListener('click', () => document.getElementById('qris-modal').classList.add('hidden'));
    
    onSnapshot(collection(db, `pcs`), (snapshot) => { const pcMonitoringDiv = document.getElementById('pc-monitoring'); const homeSewaButtonContainer = document.getElementById('home-sewa-button-container'); pcMonitoringDiv.innerHTML = ''; homeSewaButtonContainer.innerHTML = ''; let isReadyPC = false; Object.values(countdownIntervals).forEach(clearInterval); countdownIntervals = {}; if (snapshot.empty) { pcMonitoringDiv.innerHTML = '<p class="col-span-full text-center text-gray-300 backdrop-blur-custom p-4 rounded-lg">Belum ada PC yang dikonfigurasi.</p>'; return; } const pcData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(pc => pc.name).sort((a, b) => a.name.localeCompare(b.name)); pcData.forEach(pc => { const statusClass = pc.status === 'READY' ? 'bg-status-ready' : pc.status === 'DIGUNAKAN' ? 'bg-status-digunakan' : 'bg-status-offline'; let timerHTML = `<p class="font-bold text-base text-white">${pc.status}</p>`; if (pc.status === 'DIGUNAKAN' && pc.endTime) { const endTime = pc.endTime.toDate(); const timerElementId = `timer-${pc.id}`; timerHTML = `<p id="${timerElementId}" class="font-bold text-base text-yellow-400">Menghitung...</p>`; countdownIntervals[pc.id] = setInterval(() => { const now = new Date(); const distance = endTime - now; const timerEl = document.getElementById(timerElementId); if(timerEl) { if (distance < 0) { clearInterval(countdownIntervals[pc.id]); timerEl.innerHTML = "Waktu Habis"; timerEl.classList.remove('text-yellow-400'); timerEl.classList.add('text-red-500'); } else { const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0'); const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0'); const seconds = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0'); timerEl.innerHTML = `${hours}:${minutes}:${seconds}`; } } }, 1000); } pcMonitoringDiv.innerHTML += `<div class="backdrop-blur-custom rounded-lg shadow-lg flex flex-col"><div class="monitor-icon p-4"><div class="status-dot ${statusClass}"></div><div class="text-center"><i class="fas fa-desktop text-5xl text-gray-400"></i><p class="mt-2 text-base font-bold text-white">${pc.name}</p></div></div><div class="p-2 text-center -mt-2">${timerHTML}</div><div class="mt-auto"><div class="monitor-stand"></div><div class="monitor-base"></div></div></div>`; if (pc.status === 'READY') isReadyPC = true; }); if (isReadyPC) { homeSewaButtonContainer.innerHTML = `<button id="sewa-sekarang-btn" class="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-sky-600 transform hover:scale-105 transition-transform duration-300 shadow-lg">Sewa Sekarang <i class="fas fa-arrow-right ml-2"></i></button>`; document.getElementById('sewa-sekarang-btn').addEventListener('click', () => showPage('sewa')); } else { homeSewaButtonContainer.innerHTML = `<button class="bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg cursor-not-allowed" disabled>Semua PC Penuh</button>`; } });
    
    onSnapshot(collection(db, `admins`), (snapshot) => { 
        const adminSelectionDiv = document.getElementById('admin-selection'); 
        adminSelectionDiv.innerHTML = ''; 
        if (snapshot.empty) return; 
        const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Makassar"})); 
        const currentHour = now.getHours(); 
        const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(admin => admin.name).sort((a,b) => a.name.localeCompare(b.name)); 
        
        admins.forEach(admin => { 
            let isActuallyOnline = admin.isOnline; 
            let scheduleText = admin.jadwal || 'Jadwal Fleksibel'; 
            if (admin.jamMulai && admin.jamSelesai) { 
                const jamMulai = parseInt(admin.jamMulai.split(':')[0]); 
                const jamSelesai = parseInt(admin.jamSelesai.split(':')[0]); 
                scheduleText = `${admin.jamMulai} - ${admin.jamSelesai} WITA`; 
                if (jamMulai > jamSelesai) { isActuallyOnline = currentHour >= jamMulai || currentHour < jamSelesai; } 
                else { isActuallyOnline = currentHour >= jamMulai && currentHour < jamSelesai; } 
            } 
            
            const statusClass = isActuallyOnline ? 'bg-green-500' : 'bg-red-500'; 
            const statusText = isActuallyOnline ? 'Online' : 'Offline'; 
            
            const cardClasses = "admin-card backdrop-blur-custom p-6 rounded-lg shadow-lg transition-all";
            const interactiveClasses = "cursor-pointer hover:border-sky-500";
            const disabledClasses = "opacity-50 cursor-not-allowed";

            const cardHTML = `
                <div class="${cardClasses} ${isActuallyOnline ? interactiveClasses : disabledClasses}" ${isActuallyOnline ? `data-admin-id="${admin.id}"` : ''}>
                    <div class="flex items-center">
                        <div class="relative"><i class="fas fa-user-circle text-4xl text-gray-300"></i><span class="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ${statusClass} ring-2 ring-black/20"></span></div>
                        <div class="ml-4">
                            <h4 class="text-xl font-bold text-white">${admin.name}</h4>
                            <p class="text-sm font-semibold ${isActuallyOnline ? 'text-green-400' : 'text-red-400'}">${statusText}</p>
                            <p class="text-xs text-gray-300 mt-1">${scheduleText}</p>
                        </div>
                    </div>
                </div>`;
            adminSelectionDiv.innerHTML += cardHTML;
        }); 
        
        document.querySelectorAll('.admin-card').forEach(card => { 
            if (!card.classList.contains('cursor-not-allowed')) {
                card.addEventListener('click', () => { 
                    const adminId = card.dataset.adminId; 
                    const selectedAdmin = admins.find(a => a.id === adminId); 
                    document.querySelectorAll('.admin-card').forEach(c => c.classList.remove('border-sky-500', 'bg-white/20')); 
                    card.classList.add('border-sky-500', 'bg-white/20'); 
                    renderHargaList(selectedAdmin); 
                });
            }
        }); 
    });

    onSnapshot(query(collection(db, 'transactions'), orderBy("timestamp", "desc"), limit(15)), (snapshot) => { const transaksiList = document.getElementById('transaksi-list'); if(!transaksiList) return; transaksiList.innerHTML = ''; if(snapshot.empty) { transaksiList.innerHTML = '<tr><td colspan="4" class="text-center p-4">Belum ada riwayat transaksi.</td></tr>'; return; } snapshot.forEach(doc => { const trx = doc.data(); const statusClass = trx.status === 'Selesai' ? 'text-green-400' : 'text-yellow-400'; transaksiList.innerHTML += `<tr class="border-b border-white/10 hover:bg-white/5"><td class="px-6 py-4 font-medium">${trx.billingId}</td><td class="px-6 py-4">${trx.paket?.nama || 'N/A'}</td><td class="px-6 py-4">${trx.adminName || 'Admin'}</td><td class="px-6 py-4 font-bold ${statusClass}">${trx.status}</td></tr>`; }); });
    const tutorialVideosData = [ { title: 'TUTORIAL MAIN FIVEM', link: 'coming soon' }, { title: 'TUTORIAL BUAT AKUN DISCORD', link: 'https://youtu.be/KAuhg-6kXhY?si=8PiS7mxwtSY4QmxP' }, { title: 'TUTORIAL BUAT AKUN STEAM', link: 'https://youtu.be/4kPkifr2ZUI?si=jbhoi6RHUxpORSoa' }, { title: 'TUTORIAL BUAT AKUN CFX.RE', link: 'coming soon' }, { title: 'TUTORIAL ON MIC DI PC DEEPLINK', link: 'https://youtu.be/0PY7c_1FaoM?si=uyZvwTUMjZiU9BaE' }, { title: 'ON MIC ANDROID', link: 'coming soon' } ]; const videoContainer = document.getElementById('tutorial-videos'); videoContainer.innerHTML = ''; tutorialVideosData.forEach(video => { const isComingSoon = video.link === 'coming soon'; const cardHTML = ` <div class="backdrop-blur-custom rounded-lg shadow-lg overflow-hidden flex flex-col"> <div class="relative h-40 bg-black/20 flex items-center justify-center"> <i class="fab fa-youtube text-5xl text-red-500"></i> ${isComingSoon ? '<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><span class="text-white font-bold">SEGERA HADIR</span></div>' : ''} </div> <div class="p-4 flex-grow flex flex-col"> <h3 class="font-bold text-white flex-grow">${video.title}</h3> ${isComingSoon ? '<button class="mt-4 w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed" disabled>Tonton</button>' : `<a href="${video.link}" target="_blank" class="mt-4 block text-center w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Tonton</a>`} </div> </div> `; videoContainer.innerHTML += cardHTML; });
    
    showPage('home');

});

