// File: js/main.js

// Impor fungsi dari file-file lain
import { setupAuthListeners, monitorAuthState } from './auth.js';
// import { setupFirestoreListeners } from './firestore.js'; // (ini untuk nanti)

// Impor fungsi inisialisasi Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// Fungsi utama untuk menjalankan aplikasi
async function runApp() {
    try {
        const response = await fetch('/api/firebase-config');
        const firebaseConfig = await response.json();
        
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // -- Panggil semua fungsi setup dari file lain di sini --
        
        // Setup untuk UI (tampilan)
        function updateUI(user, isAdmin, displayName) { /* ... pindahkan kode update UI kesini ... */ }
        function showPage(pageId) { /* ... pindahkan kode showPage kesini ... */ }
        function showToast(message, type) { /* ... pindahkan kode showToast kesini ... */ }

        // Jalankan fungsi dari file auth.js
        monitorAuthState(db, updateUI);
        setupAuthListeners(db, showToast, showPage);

        // Jalankan fungsi dari file firestore.js (untuk nanti)
        // setupFirestoreListeners(db);

        console.log("Aplikasi XyCloud berhasil dimuat!");

    } catch (error) {
        console.error("Gagal memuat aplikasi:", error);
        document.body.innerHTML = "<h1>Error Memuat Website</h1>";
    }
}

// Jalankan aplikasi
runApp();
