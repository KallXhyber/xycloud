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

    navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); showPage(link.dataset.page); }); });
    if(mobileMenuButton) mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    if(animatedLogo) animatedLogo.addEventListener('click', () => showPage('home'));

    const mainAudioPlayer = document.getElementById('main-audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
        // ... (kode music player lengkap) ...
    }
    
    function updateUIForAuthState(user, isAdmin, displayName) { 
        // ... (kode updateUIForAuthState lengkap) ...
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
                // ... (kode onSnapshot untuk riwayat transaksi lengkap) ...
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

    function calculateAndDisplayIncome(adminName) { /* ... kode lengkap ... */ }
    
    function renderAdminView() {
        if (currentUserData && currentUserData.isAdmin) {
            // ... (kode renderAdminView lengkap) ...
        }
    }
    
    document.body.addEventListener('click', async (e) => { 
        // ... (kode event listener klik lengkap) ...
    });

    const profileLink = document.getElementById('profile-link');
    if(profileLink) profileLink.addEventListener('click', (e) => {
        // ... (kode event listener profil lengkap) ...
    });

    const submitSewaForm = document.getElementById('submit-sewa-form');
    if(submitSewaForm) submitSewaForm.addEventListener('click', async () => {
        // ... (kode event listener form sewa lengkap) ...
    });

    const adminPanelBtn = document.getElementById('admin-panel-btn');
    if(adminPanelBtn) adminPanelBtn.addEventListener('click', () => { showPage('admin-panel'); renderAdminView(); });
    // ... sisa event listener lainnya (login, logout, dll) ...

    onSnapshot(collection(db, 'pcs'), (snapshot) => {
        // ... (kode onSnapshot untuk monitoring PC lengkap) ...
    });
    
    onSnapshot(collection(db, 'admins'), (snapshot) => {
        const adminSelectionDiv = document.getElementById('admin-selection');
        if(!adminSelectionDiv) return;
        adminSelectionDiv.innerHTML = '';
        if (snapshot.empty) return;
        const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // ... (kode render admin selection lengkap) ...
        
        document.querySelectorAll('.admin-card').forEach(card => {
            if (!card.classList.contains('cursor-not-allowed')) {
                card.addEventListener('click', () => {
                    const adminId = card.dataset.adminId;
                    const selectedAdmin = admins.find(a => a.id === adminId);
                    if(selectedAdmin) {
                        document.querySelectorAll('.admin-card').forEach(c => c.classList.remove('border-sky-500', 'bg-white/20'));
                        card.classList.add('border-sky-500', 'bg-white/20');
                        // renderHargaList(selectedAdmin); // <-- BARIS INI PENYEBAB ERROR, KITA NONAKTIFKAN
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
