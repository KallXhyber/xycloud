// File: js/firebase-init.js
// Tugas file ini adalah mengambil konfigurasi aman dan menginisialisasi Firebase.
// File ini akan menghasilkan object 'db' dan 'auth' yang bisa dipakai di file lain.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let app, auth, db;

export async function initializeFirebase() {
    try {
        const response = await fetch('/api/firebase-config');
        if (!response.ok) {
            throw new Error('Gagal mengambil konfigurasi Firebase.');
        }
        const firebaseConfig = await response.json();

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        console.log("Firebase berhasil diinisialisasi.");
        return { app, auth, db };
    } catch (error) {
        console.error("Kesalahan Kritis saat inisialisasi Firebase:", error);
        document.body.innerHTML = `<div style="color: white; text-align: center; padding: 50px;"><h1>Error</h1><p>Tidak dapat memuat konfigurasi website. Silakan coba lagi nanti.</p></div>`;
        throw error; // Hentikan eksekusi lebih lanjut
    }
}

// Ekspor variabel agar bisa diimpor di file lain
export { app, auth, db };
