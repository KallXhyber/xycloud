// File: js/firestore.js
// Berisi semua fungsi yang berinteraksi dengan Firestore (database).

import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    limit,
    where
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase-init.js';
import { renderPcMonitoring } from './ui.js';

let countdownIntervals = {};

// Fungsi untuk mendengarkan perubahan pada koleksi 'pcs'
export function listenToPcs() {
    const pcsCollection = collection(db, 'pcs');
    const q = query(pcsCollection, orderBy('name')); // Mengurutkan berdasarkan nama
    
    onSnapshot(q, (snapshot) => {
        const pcData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPcMonitoring(pcData, countdownIntervals);
    });
}

// Fungsi untuk mendengarkan perubahan pada koleksi 'admins'
export function listenToAdmins() {
    const adminsCollection = collection(db, 'admins');
    onSnapshot(adminsCollection, (snapshot) => {
        const adminsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Panggil fungsi render untuk admin di sini
        // renderAdminSelection(adminsData);
    });
}

// Tambahkan fungsi listener lainnya untuk transaksi, dll.
