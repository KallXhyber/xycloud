import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInAnonymously, updatePassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, setDoc, getDoc, updateDoc, query, orderBy, limit, serverTimestamp, where, addDoc, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
    
    // CARI onAuthStateChanged dan GANTI dengan versi ini
onAuthStateChanged(auth, async (user) => { 
    currentUser = user; 
    const transaksiList = document.getElementById('transaksi-list');
    if(!transaksiList) return;
    
    transaksiList.innerHTML = '<tr><td colspan="4" class="text-center p-4">Memuat data...</td></tr>';

    if (user) { 
        const userDocRef = doc(db, `users/${user.uid}`); 
        const userDoc = await getDoc(userDocRef); 
        if (userDoc.exists()) {
            currentUserData = { id: user.uid, ...userDoc.data() };
        } else {
            currentUserData = null;
        }
        updateUIForAuthState(user, currentUserData?.isAdmin || false, user.displayName || 'Tamu'); 

        // LOGIKA BARU UNTUK MENAMPILKAN TRANSAKSI
        let transQuery;
        if (currentUserData && currentUserData.isAdmin) {
            // Jika admin, tampilkan 15 transaksi terakhir dari semua orang
            transQuery = query(collection(db, 'transactions'), orderBy("timestamp", "desc"), limit(15));
        } else {
            // Jika pengguna biasa, tampilkan hanya transaksi miliknya
            transQuery = query(collection(db, 'transactions'), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
        }
        
        onSnapshot(transQuery, (snapshot) => {
            transaksiList.innerHTML = '';
            if(snapshot.empty) {
                transaksiList.innerHTML = '<tr><td colspan="4" class="text-center p-4">Belum ada riwayat transaksi.</td></tr>';
                return;
            }
            snapshot.forEach(doc => {
                const trx = doc.data();
                const statusClass = trx.status === 'Selesai' ? 'text-green-400' : 'text-yellow-400';
                transaksiList.innerHTML += `<tr class="border-b border-white/10 hover:bg-white/5"><td class="px-6 py-4 font-medium">${trx.billingId}</td><td class="px-6 py-4">${trx.paket?.nama || 'N/A'}</td><td class="px-6 py-4">${trx.adminName || 'Admin'}</td><td class="px-6 py-4 font-bold ${statusClass}">${trx.status}</td></tr>`;
            });
        });

    } else { 
        currentUserData = null; 
        updateUIForAuthState(null, false, null); 
        transaksiList.innerHTML = '<tr><td colspan="4" class="text-center p-4">Silakan login untuk melihat riwayat transaksi.</td></tr>';
    } 
});
    // --- FUNGSI-FUNGSI UNTUK MENAMPILKAN DATA ---
    function renderHargaList(admin) { /* Kode ini tidak berubah dari file Anda */ }
    
    function calculateAndDisplayIncome(adminName) { 
        const incomeDisplay = document.getElementById('total-pendapatan'); 
        const q = query(collection(db, 'usageLogs'), where('adminName', '==', adminName)); 
        onSnapshot(q, (snapshot) => { 
            let totalPendapatan = 0; 
            snapshot.forEach(doc => { totalPendapatan += doc.data().keuntungan || 0; }); 
            incomeDisplay.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPendapatan); 
        }); 
    }
    
    // --- FUNGSI RENDER ADMIN PANEL ---
    function renderAdminView() {
        if (currentUserData && currentUserData.isAdmin) {
            const adminPcControls = document.getElementById('admin-pc-controls');
            const adminTransaksiList = document.getElementById('admin-transaksi-list');
            const adminStatusControls = document.getElementById('admin-status-controls');

            // 1. Render Kontrol PC
            onSnapshot(collection(db, 'pcs'), (snapshot) => { /* Kode ini tidak berubah dari file Anda */ });

            // 2. Render Manajemen Transaksi
            const transQuery = query(
                collection(db, 'transactions'),
                where("adminName", "==", currentUserData.name),
                where("status", "in", ["Menunggu Konfirmasi", "Menunggu Pembayaran"]),
                orderBy("timestamp", "desc")
            );
            onSnapshot(transQuery, (snapshot) => {
                adminTransaksiList.innerHTML = '';
                if (snapshot.empty) {
                    adminTransaksiList.innerHTML = '<p class="text-center text-gray-300">Tidak ada tugas transaksi.</p>';
                    return;
                }
                snapshot.forEach(doc => {
                    const trx = { id: doc.id, ...doc.data() };
                    let buttonHTML = '';
                    const trxDataString = JSON.stringify(trx).replace(/'/g, "&apos;");

                    if (trx.status === "Menunggu Konfirmasi") {
                        buttonHTML = `<button class="konfirmasi-transaksi-btn mt-2 w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700" data-id="${trx.id}">Konfirmasi Pesanan</button>`;
                    } else if (trx.status === "Menunggu Pembayaran") {
                        buttonHTML = `<button class="selesaikan-transaksi-btn mt-2 w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600" data-id="${trx.id}" data-trx='${trxDataString}'>Selesaikan Transaksi</button>`;
                    }

                    adminTransaksiList.innerHTML += `
                        <div class="backdrop-blur-custom p-3 rounded-md">
                            <p class="text-white"><strong>ID:</strong> ${trx.billingId} (${trx.userDisplayName})</p>
                            <p class="text-white"><strong>Status:</strong> <span class="font-bold text-yellow-400">${trx.status}</span></p>
                            ${buttonHTML}
                        </div>
                    `;
                });
            }, (error) => {
                console.error("Error fetching transactions: ", error);
                adminTransaksiList.innerHTML = '<p class="text-center text-red-400">Gagal memuat transaksi. Cek Index & Rules.</p>';
            });

            // 3. Render Kontrol Status Admin
            onSnapshot(collection(db, 'admins'), (snapshot) => { /* Kode ini tidak berubah dari file Anda */ });
        }
    }
    
    // --- EVENT LISTENER UNTUK SEMUA KLIK & PERUBAHAN ---
    document.body.addEventListener('change', async (e) => { /* Kode ini tidak berubah dari file Anda */ });

    document.body.addEventListener('input', (e) => { /* Kode ini tidak berubah dari file Anda */ });
    
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
            } catch (error) { showToast("Gagal mengonfirmasi.", "error"); }
        }

        if (target.classList.contains('selesaikan-transaksi-btn')) {
            const trxId = target.dataset.id;
            const trxData = JSON.parse(target.dataset.trx);
            if (!trxId || !trxData) return;
            try {
                const trxDocRef = doc(db, 'transactions', trxId);
                await updateDoc(trxDocRef, { status: "Selesai" });
                
                const adminDoc = await getDoc(doc(db, 'admins', trxData.adminId));
                if (adminDoc.exists() && adminDoc.data().role === 'reseller' && trxData.paket.keuntungan > 0) {
                    await addDoc(collection(db, 'usageLogs'), {
                        adminName: trxData.adminName,
                        keuntungan: trxData.paket.keuntungan,
                        paketNama: trxData.paket.nama,
                        userDisplayName: trxData.userDisplayName,
                        timestamp: serverTimestamp()
                    });
                    showToast("Transaksi Selesai & Pendapatan dicatat!", "success");
                } else {
                    showToast("Transaksi Selesai!", "success");
                }
            } catch (error) {
                console.error("Gagal menyelesaikan transaksi: ", error);
                showToast("Gagal menyelesaikan transaksi.", "error");
            }
        }
    });

    // --- EVENT LISTENER UNTUK TOMBOL & FORM ---
    document.getElementById('profile-link').addEventListener('click', (e) => { /* Kode ini tidak berubah dari file Anda */ });
    document.getElementById('submit-sewa-form').addEventListener('click', async () => { /* Kode ini tidak berubah dari file Anda */ });
    document.getElementById('admin-panel-btn').addEventListener('click', () => { showPage('admin-panel'); renderAdminView(); });
    // ... sisa event listener tidak berubah ...

    // --- LISTENER GLOBAL & KONTEN DINAMIS ---
    onSnapshot(collection(db, `pcs`), (snapshot) => { /* Kode ini tidak berubah dari file Anda */ });
    onSnapshot(collection(db, `admins`), (snapshot) => { /* Kode ini tidak berubah dari file Anda */ });
    
    showPage('home');
});

