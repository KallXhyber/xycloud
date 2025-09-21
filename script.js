import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInAnonymously, updatePassword, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, setDoc, getDoc, updateDoc, query, orderBy, limit, serverTimestamp, where, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// FUNGSI HELPER
function formatDetikKeWaktu(totalDetik) {
    if (isNaN(totalDetik) || totalDetik <= 0) {
        return "0 Jam 0 Menit";
    }
    const jam = Math.floor(totalDetik / 3600);
    const sisaDetik = totalDetik % 3600;
    const menit = Math.floor(sisaDetik / 60);
    return `${jam} Jam ${menit} Menit`;
}

// INISIALISASI FIREBASE
const firebaseConfig = { apiKey: "AIzaSyCXUy_NPBoC4scskd6tRJNoJtR0NRAfTJ8", authDomain: "xycloud-531d2.firebaseapp.com", projectId: "xycloud-531d2", storageBucket: "xycloud-531d2.appspot.com", messagingSenderId: "528538517556", appId: "1:52853851756:web:3bd4ac8f6dbd9ad52c8a61", measurementId: "G-Z02Z4EEKY4" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// VARIABEL GLOBAL
let currentUser = null, currentUserData = null, selectedSewaData = {}, countdownIntervals = {}, currentTrackIndex = 0;

const playlist = [ 
    { title: "Garam & Madu", artist: "Tenxi", src: "https://g.top4top.io/m_3550tbjv31.mp3" }, 
    { title: "Jarang pulang", artist: "Lina lady geboy", src: "https://j.top4top.io/m_3550yryj20.mp3" }
];

// FUNGSI TOAST NOTIFICATION
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
    
    if (type === 'success' && successSound) successSound.play().catch(e => {}); 
    else if (type === 'info' && infoSound) infoSound.play().catch(e => {});
    else if (errorSound) errorSound.play().catch(e => {}); 

    setTimeout(() => { toast.classList.add('show'); }, 100); 
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => { toast.remove(); }, 500); }, 4000); 
}

// FUNGSI NAVIGASI HALAMAN (SPA)
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

// FUNGSI UTAMA YANG DIJALANKAN SAAT HALAMAN SELESAI DIMUAT
document.addEventListener('DOMContentLoaded', () => {
    // Event listener untuk navigasi
    navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); showPage(link.dataset.page); }); });
    if(mobileMenuButton) mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    if(animatedLogo) animatedLogo.addEventListener('click', () => showPage('home'));

    // --- LOGIKA MUSIC PLAYER ---
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
    
    // --- FUNGSI OTENTIKASI & MANAJEMEN USER ---
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
            if (userDoc.exists()) {
                currentUserData = { id: user.uid, ...userDoc.data() };
            }
            updateUIForAuthState(user, currentUserData?.isAdmin || false, user.displayName || 'Tamu'); 
        } else { 
            currentUserData = null; 
            updateUIForAuthState(null, false, null); 
        } 
    });

    // --- FUNGSI-FUNGSI UNTUK MENAMPILKAN DATA ---
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
    
    // --- FUNGSI RENDER ADMIN PANEL (SUDAH DIPERBAIKI) ---
    function renderAdminView() {
        // Pastikan currentUserData sudah terisi sebelum menjalankan query
        if (currentUserData && currentUserData.isAdmin) {
            const adminPcControls = document.getElementById('admin-pc-controls');
            const adminTransaksiList = document.getElementById('admin-transaksi-list');
            const adminStatusControls = document.getElementById('admin-status-controls');

            // 1. Render Kontrol PC
            onSnapshot(collection(db, 'pcs'), (snapshot) => { 
                adminPcControls.innerHTML = ''; 
                const pcs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(pc => pc.name).sort((a,b) => a.name.localeCompare(b.name)); 
                pcs.forEach(pc => { 
                    let timerControlHTML = ''; 
                    if (pc.status === 'DIGUNAKAN') { 
                        timerControlHTML = `<div class="flex items-center gap-2 mt-2"><input type="number" placeholder="Menit" class="w-20 bg-white/10 text-white rounded p-1 text-center pc-timer-input"><button class="bg-blue-600 text-white px-2 py-1 rounded text-sm set-waktu-btn" data-id="${pc.id}">Set Waktu</button></div>`; 
                    } 
                    adminPcControls.innerHTML += `<div class="backdrop-blur-custom p-3 rounded-md"><div class="flex items-center justify-between"><span class="font-bold text-white">${pc.name}</span><select class="pc-status-select bg-black/30 text-white rounded p-1" data-id="${pc.id}"><option value="READY" ${pc.status === 'READY' ? 'selected' : ''}>Ready</option><option value="DIGUNAKAN" ${pc.status === 'DIGUNAKAN' ? 'selected' : ''}>Digunakan</option><option value="OFFLINE" ${pc.status === 'OFFLINE' ? 'selected' : ''}>Offline</option></select></div>${timerControlHTML}</div>`; 
                }); 
            });

            // 2. Render Manajemen Transaksi (Konfirmasi)
            const transQuery = query(
                collection(db, 'transactions'),
                where("adminName", "==", currentUserData.name),
                where("status", "==", "Menunggu Konfirmasi"),
                orderBy("timestamp", "desc")
            );
            onSnapshot(transQuery, (snapshot) => {
                adminTransaksiList.innerHTML = '';
                if (snapshot.empty) {
                    adminTransaksiList.innerHTML = '<p class="text-center text-gray-300">Tidak ada transaksi yang perlu dikonfirmasi.</p>';
                    return;
                }
                snapshot.forEach(doc => {
                    const trx = { id: doc.id, ...doc.data() };
                    adminTransaksiList.innerHTML += `
                        <div class="backdrop-blur-custom p-3 rounded-md">
                            <p class="text-white"><strong>ID:</strong> ${trx.billingId} (${trx.userDisplayName})</p>
                            <p class="text-white"><strong>Paket:</strong> ${trx.paket?.nama || 'N/A'}</p>
                            <button class="konfirmasi-transaksi-btn mt-2 w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700" data-id="${trx.id}">
                                <i class="fas fa-check-circle mr-2"></i>Konfirmasi Pesanan
                            </button>
                        </div>
                    `;
                });
            });

            // 3. Render Kontrol Status Admin
            onSnapshot(collection(db, 'admins'), (snapshot) => { 
                adminStatusControls.innerHTML = ''; 
                const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(admin => admin.name).sort((a,b) => a.name.localeCompare(b.name)); 
                admins.forEach(admin => { 
                    adminStatusControls.innerHTML += `<div class="flex items-center space-x-2"><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" value="" class="sr-only peer admin-online-toggle" data-id="${admin.id}" ${admin.isOnline ? 'checked' : ''}><div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div></label><span class="font-bold text-white">${admin.name}</span></div>`; 
                }); 
            });
        } else {
            console.log("Menunggu data admin atau bukan admin...");
        }
    }
    
    // --- EVENT LISTENER UNTUK SEMUA KLIK & PERUBAHAN ---
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

        if (target.classList.contains('konfirmasi-transaksi-btn')) {
            const trxId = target.dataset.id;
            if (!trxId) return;
            try {
                const trxDocRef = doc(db, 'transactions', trxId);
                await updateDoc(trxDocRef, { status: "Menunggu Pembayaran" });
                showToast("Transaksi berhasil dikonfirmasi!", "success");
            } catch (error) {
                console.error("Gagal konfirmasi transaksi: ", error);
                showToast("Gagal mengonfirmasi.", "error");
            }
        }
        if (target.id === 'beli-akun-btn') { /* ... kode beli akun ... */ } 
        if (target.classList.contains('sewa-paket-btn') || target.classList.contains('sewa-kustom-btn')) { /* ... kode sewa ... */ } 
        if (target.classList.contains('set-waktu-btn')) { /* ... kode set waktu ... */ } 
    });

    // --- EVENT LISTENER UNTUK TOMBOL & FORM ---
    document.getElementById('register-email-btn').addEventListener('click', async () => { /* ... kode registrasi ... */ });
    document.getElementById('profile-link').addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentUser || currentUser.isAnonymous || !currentUserData) return;
        document.getElementById('profile-email').value = currentUser.email || 'Tidak ada email';
        document.getElementById('profile-displayname').value = currentUser.displayName || '';
        document.getElementById('profile-new-password').value = '';
        const pendapatanContainer = document.getElementById('pendapatan-container');
        const sisaWaktuContainer = document.getElementById('sisa-waktu-container');
        const sisaWaktuDisplay = document.getElementById('sisa-waktu-display');
        if (currentUserData.sisaWaktuDetik && currentUserData.sisaWaktuDetik > 0) {
            sisaWaktuDisplay.textContent = formatDetikKeWaktu(currentUserData.sisaWituDetik);
            sisaWaktuContainer.classList.remove('hidden');
        } else {
            sisaWaktuContainer.classList.add('hidden');
        }
        if (currentUserData.isAdmin && currentUserData.role === 'reseller') {
            pendapatanContainer.classList.remove('hidden');
            calculateAndDisplayIncome(currentUserData.name);
        } else {
            pendapatanContainer.classList.add('hidden');
        }
        showPage('profile');
    });
    document.getElementById('save-profile-btn').addEventListener('click', async () => { /* ... kode simpan profil ... */ });
    document.getElementById('login-btn-main').addEventListener('click', () => document.getElementById('login-modal').classList.remove('hidden'));
    document.getElementById('close-login-modal').addEventListener('click', () => document.getElementById('login-modal').classList.add('hidden'));
    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth).then(() => showToast('Logout berhasil.')));
    document.getElementById('google-login-btn').addEventListener('click', () => { /* ... kode login google ... */ });
    document.getElementById('login-email-btn').addEventListener('click', () => { /* ... kode login email ... */ });
    document.getElementById('anonymous-login-btn').addEventListener('click', () => { /* ... kode login tamu ... */ });
    document.getElementById('admin-panel-btn').addEventListener('click', () => { showPage('admin-panel'); renderAdminView(); });
    document.getElementById('cancel-sewa-form').addEventListener('click', () => document.getElementById('sewa-form-modal').classList.add('hidden'));
    document.getElementById('submit-sewa-form').addEventListener('click', async () => {
        const waInput = document.getElementById('whatsapp-input').value;
        if (waInput.length !== 4 || !/^\d+$/.test(waInput)) {
            showToast('Mohon masukkan 4 digit angka yang valid.', 'error');
            return;
        }
        const user = auth.currentUser;
        if (!user || !selectedSewaData.paket) {
            showToast('Sesi tidak valid. Silakan coba lagi.', 'error');
            return;
        }
        const billingId = waInput;
        const adminInfo = selectedSewaData.admin;
        const paketInfo = selectedSewaData.paket;
        const transactionData = {
            userId: user.uid,
            userDisplayName: user.displayName,
            billingId: billingId,
            adminName: adminInfo.name,
            adminId: adminInfo.id,
            paket: paketInfo,
            status: "Menunggu Konfirmasi",
            timestamp: serverTimestamp()
        };
        try {
            const docRef = await addDoc(collection(db, "transactions"), transactionData);
            console.log("Transaksi tertunda berhasil dibuat dengan ID: ", docRef.id);
            let adminWhatsapp = adminInfo.whatsapp.replace(/\D/g, '');
            if (adminWhatsapp.startsWith('0')) {
                adminWhatsapp = '62' + adminWhatsapp.substring(1);
            }
            const message = encodeURIComponent(`Halo Admin ${adminInfo.name},\n\nSaya sudah membuat permintaan sewa:\n- Pengguna: ${user.displayName}\n- Paket: ${paketInfo.nama}\n- Billing ID: ${billingId}\n\nMohon untuk dikonfirmasi.`);
            document.getElementById('sewa-form-modal').classList.add('hidden');
            document.getElementById('qris-instruction').innerHTML = `Permintaan sewa dengan ID <strong class="text-white">${billingId}</strong> sedang menunggu konfirmasi dari <strong class="text-white">${adminInfo.name}</strong>.`;
            document.getElementById('whatsapp-link-qris').href = `https://wa.me/${adminWhatsapp}?text=${message}`;
            document.getElementById('qris-modal').classList.remove('hidden');
            showToast('Permintaan sewa terkirim, tunggu konfirmasi admin.', 'info');
        } catch (error) {
            console.error("Gagal membuat transaksi: ", error);
            showToast("Gagal membuat permintaan sewa.", "error");
        }
    });
    document.getElementById('close-qris-modal').addEventListener('click', () => document.getElementById('qris-modal').classList.add('hidden'));
    
    // --- LISTENER GLOBAL UNTUK DATA REALTIME DARI FIRESTORE ---
    onSnapshot(collection(db, `pcs`), (snapshot) => { /* ... kode monitoring pc ... */ });
    onSnapshot(collection(db, `admins`), (snapshot) => { /* ... kode pilihan admin ... */ });
    onSnapshot(query(collection(db, 'transactions'), orderBy("timestamp", "desc"), limit(15)), (snapshot) => { /* ... kode riwayat transaksi ... */ });
    
    // --- RENDER KONTEN DINAMIS LAINNYA ---
    const tutorialVideosData = [ /* ... data video ... */ ]; 
    // ... kode render video ...

    showPage('home');
});
