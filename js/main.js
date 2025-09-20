// File: js/main.js
// Ini adalah file utama (entry point) yang akan menjalankan seluruh aplikasi.
// Tugasnya mengimpor semua modul dan mengaturnya.

import { initializeFirebase } from './firebase-init.js';
import { showPage, updateUIForAuthState } from './ui.js';
import { monitorAuthState, setupAuthEventListeners } from './auth.js';
import { listenToPcs, listenToAdmins } from './firestore.js';

// Fungsi untuk menjalankan seluruh aplikasi
async function startApp() {
    try {
        // 1. Inisialisasi Firebase terlebih dahulu
        await initializeFirebase();

        // 2. Pasang semua event listener dasar (navigasi, menu, dll)
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showPage(link.dataset.page);
            });
        });
        document.getElementById('mobile-menu-button').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

        // 3. Pasang event listener untuk autentikasi
        setupAuthEventListeners();

        // 4. Mulai memantau status login dan update UI
        monitorAuthState(updateUIForAuthState);

        // 5. Mulai mendengarkan data realtime dari Firestore
        listenToPcs();
        listenToAdmins();
        // listenToTransactions(); // (bisa ditambahkan nanti)

        // 6. Tampilkan halaman awal
        showPage('home');
        
        console.log("Aplikasi XyCloud berhasil dimuat dan dijalankan.");

    } catch (error) {
        console.error("Gagal menjalankan aplikasi:", error);
    }
}

// Jalankan aplikasi setelah seluruh halaman dimuat
document.addEventListener('DOMContentLoaded', startApp);

