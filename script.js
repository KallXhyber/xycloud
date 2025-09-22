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
    { title: "Jarang pulang", artist: "Lina lady geboy", src: "https://j.top4top.io/m_3550yryj20.mp3" },
    { title: "Untungnya", artist: "Bernadya", src: "https://j.top4top.io/m_35517qyii1.mp3" },
    { title: "Tia monika", artist: "Alo x Tia monika", src: "https://c.top4top.io/m_35511aw9r1.mp3" }
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
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
        const nextBtn = document.getElementById('next-track-btn');
        const prevBtn = document.getElementById('prev-track-btn');
        const trackTitleEl = document.getElementById('track-title');
        const trackArtistEl = document.getElementById('track-artist');
        const musicPlayerEl = document.getElementById('music-player');
        const minimizePlayerBtn = document.getElementById('minimize-player-btn');
        const minimizedIcon = document.getElementById('minimized-icon');
        const volumeSlider = document.getElementById('volume-slider');
        
        function loadTrack(index) {
            const track = playlist[index];
            if(trackTitleEl) trackTitleEl.textContent = track.title;
            if(trackArtistEl) trackArtistEl.textContent = track.artist;
            if(mainAudioPlayer) mainAudioPlayer.src = track.src;
            if(mainAudioPlayer && volumeSlider) mainAudioPlayer.volume = volumeSlider.value / 100;
        }
        function playTrack() {
            if(mainAudioPlayer) mainAudioPlayer.play().catch(e => {});
            if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        function pauseTrack() {
            if(mainAudioPlayer) mainAudioPlayer.pause();
            if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }

        playPauseBtn.addEventListener('click', () => { mainAudioPlayer.paused ? playTrack() : pauseTrack(); });
        if(nextBtn) nextBtn.addEventListener('click', () => { currentTrackIndex = (currentTrackIndex + 1) % playlist.length; loadTrack(currentTrackIndex); playTrack(); });
        if(prevBtn) prevBtn.addEventListener('click', () => { currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length; loadTrack(currentTrackIndex); playTrack(); });
        if(volumeSlider) volumeSlider.addEventListener('input', (e) => { mainAudioPlayer.volume = e.target.value / 100; });
        if(mainAudioPlayer) mainAudioPlayer.addEventListener('ended', () => nextBtn.click());
        if(minimizePlayerBtn) minimizePlayerBtn.addEventListener('click', () => musicPlayerEl.classList.add('minimized'));
        if(minimizedIcon) minimizedIcon.addEventListener('click', () => musicPlayerEl.classList.remove('minimized'));
        
        loadTrack(currentTrackIndex);
    }
    
    // --- FUNGSI OTENTIKASI & MANAJEMEN USER ---
    function updateUIForAuthState(user, isAdmin, displayName) { 
        const loginContainer = document.getElementById('login-container');
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        const adminPanelBtn = document.getElementById('admin-panel-btn');
        const profileLink = document.getElementById('profile-link');
        
        if (user) {
            if(loginContainer) loginContainer.classList.add('hidden');
            if(userInfo) {
                userInfo.classList.remove('hidden');
                userInfo.classList.add('flex');
            }
            if(userName) userName.textContent = displayName;
            if(profileLink) profileLink.classList.toggle('hidden', user.isAnonymous);
            if(adminPanelBtn) adminPanelBtn.classList.toggle('hidden', !isAdmin);
        } else {
            if(loginContainer) loginContainer.classList.remove('hidden');
            if(userInfo) userInfo.classList.add('hidden');
            if(adminPanelBtn) adminPanelBtn.classList.add('hidden');
        }
    }
    
    onAuthStateChanged(auth, async (user) => { 
        currentUser = user; 
        
        const transaksiList = document.getElementById('transaksi-list');
        if (transaksiList) {
            transaksiList.innerHTML = '<tr><td colspan="4" class="text-center p-4">Memuat data...</td></tr>';
        }

        if (user) { 
            const userDocRef = doc(db, `users/${user.uid}`); 
            const userDoc = await getDoc(userDocRef); 
            if (userDoc.exists()) {
                currentUserData = { id: user.uid, ...userDoc.data() };
            } else {
                currentUserData = null;
            }
            updateUIForAuthState(user, currentUserData?.isAdmin || false, user.displayName || 'Tamu'); 

            let transQuery;
            if (currentUserData && currentUserData.isAdmin) {
                transQuery = query(collection(db, 'transactions'), orderBy("timestamp", "desc"), limit(15));
            } else {
                transQuery = query(collection(db, 'transactions'), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
            }
            
            onSnapshot(transQuery, (snapshot) => {
                if(transaksiList) {
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
                }
            });

        } else { 
            currentUserData = null; 
            updateUIForAuthState(null, false, null); 
            if (transaksiList) {
                transaksiList.innerHTML = '<tr><td colspan="4" class="text-center p-4">Silakan login untuk melihat riwayat transaksi.</td></tr>';
            }
        } 
    });

    // --- FUNGSI-FUNGSI UNTUK MENAMPILKAN DATA ---
    function calculateAndDisplayIncome(adminName) { 
        const incomeDisplay = document.getElementById('total-pendapatan'); 
        const q = query(collection(db, 'usageLogs'), where('adminName', '==', adminName)); 
        onSnapshot(q, (snapshot) => { 
            let totalPendapatan = 0; 
            snapshot.forEach(doc => { totalPendapatan += doc.data().keuntungan || 0; }); 
            if(incomeDisplay) incomeDisplay.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPendapatan); 
        }); 
    }
    
    function renderAdminView() {
        if (currentUserData && currentUserData.isAdmin) {
            const adminPcControls = document.getElementById('admin-pc-controls');
            const adminTransaksiList = document.getElementById('admin-transaksi-list');
            const adminStatusControls = document.getElementById('admin-status-controls');

            if(adminPcControls) onSnapshot(collection(db, 'pcs'), (snapshot) => { /* ... Kode tidak berubah ... */ });

            if(adminTransaksiList) {
                const transQuery = query(collection(db, 'transactions'), where("adminName", "==", currentUserData.name), where("status", "in", ["Menunggu Konfirmasi", "Menunggu Pembayaran"]), orderBy("timestamp", "desc"));
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
                        adminTransaksiList.innerHTML += `<div class="backdrop-blur-custom p-3 rounded-md"><p class="text-white"><strong>ID:</strong> ${trx.billingId} (${trx.userDisplayName})</p><p class="text-white"><strong>Status:</strong> <span class="font-bold text-yellow-400">${trx.status}</span></p>${buttonHTML}</div>`;
                    });
                }, (error) => {
                    console.error("Error fetching transactions: ", error);
                    adminTransaksiList.innerHTML = '<p class="text-center text-red-400">Gagal memuat transaksi. Cek Index & Rules.</p>';
                });
            }

            if(adminStatusControls) onSnapshot(collection(db, 'admins'), (snapshot) => { /* ... Kode tidak berubah ... */ });
        }
    }
    
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
                    await addDoc(collection(db, 'usageLogs'), { /* ... data keuntungan ... */ });
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

    const profileLink = document.getElementById('profile-link');
    if(profileLink) profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentUser || currentUser.isAnonymous || !currentUserData) return;
        document.getElementById('profile-email').value = currentUser.email || 'Tidak ada email';
        document.getElementById('profile-displayname').value = currentUser.displayName || '';
        document.getElementById('profile-new-password').value = '';
        const pendapatanContainer = document.getElementById('pendapatan-container');
        const sisaWaktuContainer = document.getElementById('sisa-waktu-container');
        const sisaWaktuDisplay = document.getElementById('sisa-waktu-display');
        if (currentUserData.sisaWaktuDetik && currentUserData.sisaWaktuDetik > 0) {
            sisaWaktuDisplay.textContent = formatDetikKeWaktu(currentUserData.sisaWaktuDetik);
            sisaWaktuContainer.classList.remove('hidden');
        } else {
            if(sisaWaktuContainer) sisaWaktuContainer.classList.add('hidden');
        }
        if (currentUserData.isAdmin && currentUserData.role === 'reseller') {
            if(pendapatanContainer) pendapatanContainer.classList.remove('hidden');
            calculateAndDisplayIncome(currentUserData.name);
        } else {
            if(pendapatanContainer) pendapatanContainer.classList.add('hidden');
        }
        showPage('profile');
    });

    const adminPanelBtn = document.getElementById('admin-panel-btn');
    if(adminPanelBtn) adminPanelBtn.addEventListener('click', () => { showPage('admin-panel'); renderAdminView(); });

    // --- LISTENER GLOBAL UNTUK DATA REALTIME DARI FIRESTORE ---
    onSnapshot(collection(db, 'pcs'), (snapshot) => {
        const pcMonitoringDiv = document.getElementById('pc-monitoring');
        const homeSewaButtonContainer = document.getElementById('home-sewa-button-container');
        if(!pcMonitoringDiv || !homeSewaButtonContainer) return;
        pcMonitoringDiv.innerHTML = '';
        homeSewaButtonContainer.innerHTML = '';
        let isReadyPC = false;
        Object.values(countdownIntervals).forEach(clearInterval);
        countdownIntervals = {};
        if (snapshot.empty) { pcMonitoringDiv.innerHTML = '<p class="col-span-full text-center text-gray-300 backdrop-blur-custom p-4 rounded-lg">Belum ada PC.</p>'; return; }
        const pcData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(pc => pc.name).sort((a, b) => a.name.localeCompare(b.name));
        pcData.forEach(pc => { /* ... kode render PC ... */ });
        if (isReadyPC) {
            homeSewaButtonContainer.innerHTML = `<button id="sewa-sekarang-btn" class="bg-sky-500 ...">Sewa Sekarang <i class="fas fa-arrow-right ml-2"></i></button>`;
            const sewaBtn = document.getElementById('sewa-sekarang-btn');
            if(sewaBtn) sewaBtn.addEventListener('click', () => showPage('sewa'));
        } else {
            homeSewaButtonContainer.innerHTML = `<button class="bg-gray-600 ..." disabled>Semua PC Penuh</button>`;
        }
    });
    
    onSnapshot(collection(db, `admins`), (snapshot) => {
        const adminSelectionDiv = document.getElementById('admin-selection');
        if(!adminSelectionDiv) return;
        adminSelectionDiv.innerHTML = '';
        if (snapshot.empty) return;
        const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Makassar"}));
        const currentHour = now.getHours();
        const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(admin => admin.name).sort((a,b) => a.name.localeCompare(b.name));
        admins.forEach(admin => { /* ... kode render admin selection ... */ });
        document.querySelectorAll('.admin-card').forEach(card => {
            if (!card.classList.contains('cursor-not-allowed')) {
                card.addEventListener('click', () => {
                    const adminId = card.dataset.adminId;
                    const selectedAdmin = admins.find(a => a.id === adminId);
                    if(selectedAdmin) {
                        document.querySelectorAll('.admin-card').forEach(c => c.classList.remove('border-sky-500', 'bg-white/20'));
                        card.classList.add('border-sky-500', 'bg-white/20');
                        // renderHargaList(selectedAdmin); // Fungsi ini belum didefinisikan di kode Anda
                    }
                });
            }
        });
    });

    const tutorialVideosData = [ { title: 'TUTORIAL MAIN FIVEM', link: 'coming soon' }, { title: 'TUTORIAL BUAT AKUN DISCORD', link: 'https://youtu.be/KAuhg-6kXhY?si=8PiS7mxwtSY4QmxP' }, { title: 'TUTORIAL BUAT AKUN STEAM', link: 'https://youtu.be/4kPkifr2ZUI?si=jbhoi6RHUxpORSoa' }, { title: 'TUTORIAL BUAT AKUN CFX.RE', link: 'coming soon' }, { title: 'TUTORIAL ON MIC DI PC DEEPLINK', link: 'https://youtu.be/0PY7c_1FaoM?si=uyZvwTUMjZiU9BaE' }, { title: 'ON MIC ANDROID', link: 'coming soon' } ];
    const videoContainer = document.getElementById('tutorial-videos');
    if(videoContainer){
        videoContainer.innerHTML = '';
        tutorialVideosData.forEach(video => {
            const isComingSoon = video.link === 'coming soon';
            const cardHTML = `<div class="backdrop-blur-custom rounded-lg shadow-lg overflow-hidden flex flex-col"><div class="relative h-40 bg-black/20 flex items-center justify-center"><i class="fab fa-youtube text-5xl text-red-500"></i> ${isComingSoon ? '<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><span class="text-white font-bold">SEGERA HADIR</span></div>' : ''}</div><div class="p-4 flex-grow flex flex-col"><h3 class="font-bold text-white flex-grow">${video.title}</h3> ${isComingSoon ? '<button class="mt-4 w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed" disabled>Tonton</button>' : `<a href="${video.link}" target="_blank" class="mt-4 block text-center w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Tonton</a>`}</div></div>`;
            videoContainer.innerHTML += cardHTML;
        });
    }

    showPage('home');
});
