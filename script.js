import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInAnonymously, updatePassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, setDoc, getDoc, updateDoc, query, orderBy, limit, serverTimestamp, where, addDoc, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// FUNGSI HELPER
function formatDetikKeWaktu(totalDetik) {
    if (isNaN(totalDetik) || totalDetik <= 0) { return "0 Jam 0 Menit"; }
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

// FUNGSI UTAMA YANG DIJALANKAN SAAT HALAMAN SELESAI DIMUAT
document.addEventListener('DOMContentLoaded', () => {
    
    // --- PEMILIHAN ELEMEN DOM ---
    const toastContainer = document.getElementById('toast-container');
    const successSound = document.getElementById('success-sound');
    const errorSound = document.getElementById('error-sound');
    const infoSound = document.getElementById('info-sound');
    if(successSound) successSound.volume = 0.5; 
    if(errorSound) errorSound.volume = 0.5;
    if(infoSound) infoSound.volume = 0.5;

    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const animatedLogo = document.querySelector('.animated-logo');

    // --- FUNGSI TOAST & NAVIGASI ---
    function showToast(message, type = 'success') { 
        const toast = document.createElement('div'); 
        const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-times-circle' : 'fa-info-circle'); 
        toast.className = `toast toast-${type}`; 
        toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`; 
        if(toastContainer) toastContainer.appendChild(toast); 
        
        if (type === 'success' && successSound) successSound.play().catch(e => {}); 
        else if (type === 'info' && infoSound) infoSound.play().catch(e => {});
        else if (errorSound) errorSound.play().catch(e => {}); 

        setTimeout(() => { toast.classList.add('show'); }, 100); 
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => { toast.remove(); }, 500); }, 4000); 
    }

    function showPage(pageId) { 
        pages.forEach(page => page.classList.remove('active')); 
        const newPage = document.getElementById(pageId); 
        if (newPage) newPage.classList.add('active'); 
        window.scrollTo(0, 0); 
        if(mobileMenu) mobileMenu.classList.add('hidden');
    }

    // --- EVENT LISTENER AWAL ---
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
        
        const loadTrack = (index) => {
            const track = playlist[index];
            if(trackTitleEl) trackTitleEl.textContent = track.title;
            if(trackArtistEl) trackArtistEl.textContent = track.artist;
            if(mainAudioPlayer) mainAudioPlayer.src = track.src;
            if(mainAudioPlayer && volumeSlider) mainAudioPlayer.volume = volumeSlider.value / 100;
        }
        const playTrack = () => {
            if(mainAudioPlayer) mainAudioPlayer.play().catch(e => {});
            if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        const pauseTrack = () => {
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
            if(userInfo) { userInfo.classList.remove('hidden'); userInfo.classList.add('flex'); }
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
        if (user) { 
            const userDocRef = doc(db, `users/${user.uid}`); 
            const userDoc = await getDoc(userDocRef); 
            currentUserData = userDoc.exists() ? { id: user.uid, ...userDoc.data() } : null;
            updateUIForAuthState(user, currentUserData?.isAdmin || false, user.displayName || 'Tamu'); 

            const transaksiList = document.getElementById('transaksi-list');
            if (transaksiList) {
                transaksiList.innerHTML = '<tr><td colspan="4" class="text-center p-4">Memuat data...</td></tr>';
                let transQuery;
                if (currentUserData && currentUserData.isAdmin) {
                    transQuery = query(collection(db, 'transactions'), orderBy("timestamp", "desc"), limit(15));
                } else {
                    transQuery = query(collection(db, 'transactions'), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
                }
                onSnapshot(transQuery, (snapshot) => {
                    if (!transaksiList) return;
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
            }
        } else { 
            currentUserData = null; 
            updateUIForAuthState(null, false, null); 
            const transaksiList = document.getElementById('transaksi-list');
            if (transaksiList) {
                transaksiList.innerHTML = '<tr><td colspan="4" class="text-center p-4">Silakan login untuk melihat riwayat transaksi.</td></tr>';
            }
        } 
    });

    // --- FUNGSI-FUNGSI BISNIS ---
    function calculateAndDisplayIncome(adminName) { 
        const incomeDisplay = document.getElementById('total-pendapatan'); 
        if(!incomeDisplay) return;
        const q = query(collection(db, 'usageLogs'), where('adminName', '==', adminName)); 
        onSnapshot(q, (snapshot) => { 
            let totalPendapatan = 0; 
            snapshot.forEach(doc => { totalPendapatan += doc.data().keuntungan || 0; }); 
            incomeDisplay.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPendapatan); 
        }); 
    }
    
    function renderAdminView() {
        if (currentUserData && currentUserData.isAdmin) {
            const adminPcControls = document.getElementById('admin-pc-controls');
            const adminTransaksiList = document.getElementById('admin-transaksi-list');
            const adminStatusControls = document.getElementById('admin-status-controls');

            if(adminPcControls) {
                onSnapshot(collection(db, 'pcs'), (snapshot) => {
                    adminPcControls.innerHTML = '';
                    const pcs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(pc => pc.name).sort((a, b) => a.name.localeCompare(b.name));
                    pcs.forEach(pc => {
                        let timerControlHTML = '';
                        if (pc.status === 'DIGUNAKAN') {
                            timerControlHTML = `<div class="flex items-center gap-2 mt-2"><input type="number" placeholder="Menit" class="w-20 bg-white/10 text-white rounded p-1 text-center pc-timer-input"><button class="bg-blue-600 text-white px-2 py-1 rounded text-sm set-waktu-btn" data-id="${pc.id}">Set Waktu</button></div>`;
                        }
                        adminPcControls.innerHTML += `<div class="backdrop-blur-custom p-3 rounded-md"><div class="flex items-center justify-between"><span class="font-bold text-white">${pc.name}</span><select class="pc-status-select bg-black/30 text-white rounded p-1" data-id="${pc.id}"><option value="READY" ${pc.status === 'READY' ? 'selected' : ''}>Ready</option><option value="DIGUNAKAN" ${pc.status === 'DIGUNAKAN' ? 'selected' : ''}>Digunakan</option><option value="OFFLINE" ${pc.status === 'OFFLINE' ? 'selected' : ''}>Offline</option></select></div>${timerControlHTML}</div>`;
                    });
                });
            }

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

            if(adminStatusControls) {
                onSnapshot(collection(db, 'admins'), (snapshot) => {
                    adminStatusControls.innerHTML = '';
                    const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(admin => admin.name).sort((a, b) => a.name.localeCompare(b.name));
                    admins.forEach(admin => {
                        adminStatusControls.innerHTML += `<div class="flex items-center space-x-2"><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" value="" class="sr-only peer admin-online-toggle" data-id="${admin.id}" ${admin.isOnline ? 'checked' : ''}><div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div></label><span class="font-bold text-white">${admin.name}</span></div>`;
                    });
                });
            }
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
                
                const adminUserDocRef = doc(db, 'users', trxData.adminId);
                const adminUserDoc = await getDoc(adminUserDocRef);

                if (adminUserDoc.exists() && adminUserDoc.data().role === 'reseller' && trxData.keuntungan > 0) {
                    await addDoc(collection(db, 'usageLogs'), {
                        adminName: trxData.adminName,
                        keuntungan: trxData.keuntungan,
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

    const profileLink = document.getElementById('profile-link');
    if(profileLink) profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentUser || !currentUserData) return;
        document.getElementById('profile-email').value = currentUser.email || 'Tidak ada email';
        document.getElementById('profile-displayname').value = currentUser.displayName || '';
        document.getElementById('profile-new-password').value = '';
        const pendapatanContainer = document.getElementById('pendapatan-container');
        const sisaWaktuContainer = document.getElementById('sisa-waktu-container');
        const sisaWaktuDisplay = document.getElementById('sisa-waktu-display');

        if (sisaWaktuContainer && currentUserData.sisaWaktuDetik > 0) {
            sisaWaktuDisplay.textContent = formatDetikKeWaktu(currentUserData.sisaWaktuDetik);
            sisaWaktuContainer.classList.remove('hidden');
        } else if (sisaWaktuContainer) {
            sisaWaktuContainer.classList.add('hidden');
        }
        
        if (pendapatanContainer && currentUserData.isAdmin && currentUserData.role === 'reseller') {
            pendapatanContainer.classList.remove('hidden');
            calculateAndDisplayIncome(currentUserData.name);
        } else if(pendapatanContainer) {
            pendapatanContainer.classList.add('hidden');
        }
        showPage('profile');
    });

    const submitSewaForm = document.getElementById('submit-sewa-form');
    if(submitSewaForm) submitSewaForm.addEventListener('click', async () => {
        const waInput = document.getElementById('whatsapp-input').value;
        if (waInput.length !== 4 || !/^\d+$/.test(waInput)) { showToast('Mohon masukkan 4 digit angka yang valid.', 'error'); return; }
        const user = auth.currentUser;
        if (!user || !selectedSewaData.paket) { showToast('Sesi tidak valid. Silakan coba lagi.', 'error'); return; }
        
        const billingId = waInput; 
        const paketInfo = selectedSewaData.paket;
        const adminInfo = selectedSewaData.admin;
        
        const transactionData = {
            userId: user.uid,
            userDisplayName: user.displayName,
            billingId: billingId,
            adminName: adminInfo.name,
            adminId: adminInfo.id,
            paket: paketInfo,
            keuntungan: selectedSewaData.keuntungan || 0,
            status: "Menunggu Konfirmasi",
            timestamp: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, 'transactions'), transactionData);
            // ... sisa kode form sewa ...
        } catch (error) {
            console.error("Gagal membuat transaksi: ", error);
            showToast("Gagal membuat permintaan sewa.", "error");
        }
    });

    const adminPanelBtn = document.getElementById('admin-panel-btn');
    if(adminPanelBtn) adminPanelBtn.addEventListener('click', () => { showPage('admin-panel'); renderAdminView(); });
    // ... sisa event listener lainnya ...

    // --- LISTENER GLOBAL UNTUK DATA REALTIME ---
    onSnapshot(collection(db, 'pcs'), (snapshot) => {
        const pcMonitoringDiv = document.getElementById('pc-monitoring');
        const homeSewaButtonContainer = document.getElementById('home-sewa-button-container');
        if(!pcMonitoringDiv || !homeSewaButtonContainer) return;
        pcMonitoringDiv.innerHTML = '';
        homeSewaButtonContainer.innerHTML = '';
        let isReadyPC = false;
        Object.values(countdownIntervals).forEach(clearInterval);
        countdownIntervals = {};
        if (snapshot.empty) { pcMonitoringDiv.innerHTML = '<p class="col-span-full text-center text-gray-300">Belum ada PC.</p>'; return; }
        const pcData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(pc => pc.name).sort((a, b) => a.name.localeCompare(b.name));
        pcData.forEach(pc => {
            const statusClass = pc.status === 'READY' ? 'bg-status-ready' : pc.status === 'DIGUNAKAN' ? 'bg-status-digunakan' : 'bg-status-offline';
            let timerHTML = `<p class="font-bold text-base text-white">${pc.status}</p>`;
            // ... logika timer ...
            pcMonitoringDiv.innerHTML += `<div class="backdrop-blur-custom rounded-lg ..."><div class="monitor-icon ..."><div class="status-dot ${statusClass}"></div>...<p class="mt-2 ...">${pc.name}</p>...</div><div class="p-2 ...">${timerHTML}</div>...</div>`;
            if (pc.status === 'READY') isReadyPC = true;
        });
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
        // ... logika render admin selection ...
        const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        admins.forEach(admin => { /* ... kode render ... */ });
        document.querySelectorAll('.admin-card').forEach(card => {
            if (!card.classList.contains('cursor-not-allowed')) {
                card.addEventListener('click', () => {
                    const adminId = card.dataset.adminId;
                    const selectedAdmin = admins.find(a => a.id === adminId);
                    if(selectedAdmin) {
                        // ... logika klik kartu admin ...
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
            const cardHTML = `<div class="backdrop-blur-custom ..."><div class="relative ..."><i class="fab fa-youtube ..."></i> ${isComingSoon ? '<div class="absolute ..."><span class="text-white ...">SEGERA HADIR</span></div>' : ''}</div><div class="p-4 ..."><h3 class="font-bold ...">${video.title}</h3> ${isComingSoon ? '<button class="..." disabled>Tonton</button>' : `<a href="${video.link}" target="_blank" class="...">Tonton</a>`}</div></div>`;
            videoContainer.innerHTML += cardHTML;
        });
    }

    showPage('home');
});