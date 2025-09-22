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

// FUNGSI TOAST NOTIFICATION
const toastContainer = document.getElementById('toast-container');
function showToast(message, type = 'success') { /* ... kode toast tidak berubah ... */ }

// FUNGSI NAVIGASI HALAMAN (SPA)
const pages = document.querySelectorAll('.page');
function showPage(pageId) { /* ... kode showPage tidak berubah ... */ }

// FUNGSI UTAMA YANG DIJALANKAN SAAT HALAMAN SELESAI DIMUAT
document.addEventListener('DOMContentLoaded', () => {
    // ... Event listener navigasi & music player tidak berubah ...
    
    // --- FUNGSI OTENTIKASI & MANAJEMEN USER (DIPERBAIKI) ---
    function updateUIForAuthState(user, isAdmin, displayName) { /* ... kode tidak berubah ... */ }
    
    onAuthStateChanged(auth, async (user) => { 
        currentUser = user; 
        if (user) { 
            const userDocRef = doc(db, `users/${user.uid}`); 
            const userDoc = await getDoc(userDocRef); 
            currentUserData = userDoc.exists() ? { id: user.uid, ...userDoc.data() } : null;
            updateUIForAuthState(user, currentUserData?.isAdmin || false, user.displayName || 'Tamu'); 

            // LOGIKA MENAMPILKAN TRANSAKSI (SUDAH DIPERBAIKI)
            const transaksiList = document.getElementById('transaksi-list');
            if (transaksiList) { // Pengecekan dipindah ke sini
                transaksiList.innerHTML = '<tr><td colspan="4" class="text-center p-4">Memuat data...</td></tr>';
                let transQuery;
                if (currentUserData && currentUserData.isAdmin) {
                    transQuery = query(collection(db, 'transactions'), orderBy("timestamp", "desc"), limit(15));
                } else {
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

    // --- FUNGSI-FUNGSI UNTUK MENAMPILKAN DATA ---
    function calculateAndDisplayIncome(adminName) { /* ... kode tidak berubah ... */ }
    
    function renderAdminView() { /* ... kode tidak berubah ... */ }
    
    // --- EVENT LISTENER UNTUK KLIK & PERUBAHAN (DIPERBAIKI) ---
    document.body.addEventListener('click', async (e) => { 
        const target = e.target.closest('button, a');
        if(!target) return;

        if (target.classList.contains('konfirmasi-transaksi-btn')) { /* ... kode tidak berubah ... */ }

        if (target.classList.contains('selesaikan-transaksi-btn')) {
            const trxId = target.dataset.id;
            const trxData = JSON.parse(target.dataset.trx);
            if (!trxId || !trxData) return;
            try {
                const trxDocRef = doc(db, 'transactions', trxId);
                await updateDoc(trxDocRef, { status: "Selesai" });
                
                // PERBAIKAN: Cek role di collection 'users' menggunakan adminId
                const adminUserDocRef = doc(db, 'users', trxData.adminId);
                const adminUserDoc = await getDoc(adminUserDocRef);

                if (adminUserDoc.exists() && adminUserDoc.data().role === 'reseller' && trxData.keuntungan > 0) {
                    await addDoc(collection(db, 'usageLogs'), {
                        adminName: trxData.adminName,
                        keuntungan: trxData.keuntungan, // Ambil dari data transaksi
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

    const submitSewaForm = document.getElementById('submit-sewa-form');
    if(submitSewaForm) submitSewaForm.addEventListener('click', async () => {
        // ... (kode form sewa)
        // PERBAIKAN: Menyimpan 'keuntungan' di dalam dokumen transaksi
        const transactionData = {
            userId: user.uid,
            userDisplayName: user.displayName,
            billingId: billingId,
            adminName: adminInfo.name,
            adminId: adminInfo.id,
            paket: paketInfo,
            keuntungan: selectedSewaData.keuntungan || 0, // <-- TAMBAHAN INI
            status: "Menunggu Konfirmasi",
            timestamp: serverTimestamp()
        };
        // ... (sisa kode form sewa)
    });

    // ... sisa event listener lainnya (profil, admin panel, etc.) tidak berubah ...
    
    // --- LISTENER GLOBAL (DIPERBAIKI) ---
    onSnapshot(collection(db, 'pcs'), (snapshot) => { /* ... kode tidak berubah ... */ });
    
    onSnapshot(collection(db, `admins`), (snapshot) => {
        const adminSelectionDiv = document.getElementById('admin-selection');
        if(!adminSelectionDiv) return;
        adminSelectionDiv.innerHTML = '';
        if (snapshot.empty) return;
        const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        admins.forEach(admin => { /* ... kode render admin selection ... */ });

        document.querySelectorAll('.admin-card').forEach(card => {
            if (!card.classList.contains('cursor-not-allowed')) {
                card.addEventListener('click', () => {
                    const adminId = card.dataset.adminId;
                    const selectedAdmin = admins.find(a => a.id === adminId);
                    if(selectedAdmin) {
                        document.querySelectorAll('.admin-card').forEach(c => c.classList.remove('border-sky-500', 'bg-white/20'));
                        card.classList.add('border-sky-500', 'bg-white/20');
                        // PERBAIKAN: Memanggil fungsi renderHargaList yang sudah ada
                        // (Asumsi: fungsi renderHargaList didefinisikan di dalam file ini atau di-import)
                        if(typeof renderHargaList === 'function') {
                           renderHargaList(selectedAdmin);
                        }
                    }
                });
            }
        });
    });

    // ... (kode render tutorial video tidak berubah) ...

    showPage('home');
});
