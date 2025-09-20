// File: js/firestore.js
// VERSI FINAL: Mengambil data dari Firestore dan memanggil fungsi render yang sesuai dari ui.js

import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    limit,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase-init.js';
import { renderPcMonitoring, renderAdminSelection, renderHargaList, showToast } from './ui.js';

let countdownIntervals = {};

export function listenToPcs() {
    const q = query(collection(db, 'pcs'), orderBy('name'));
    onSnapshot(q, (snapshot) => {
        const pcData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPcMonitoring(pcData, countdownIntervals);
    });
}

export function listenToAdmins() {
    const q = query(collection(db, 'admins'), orderBy('name'));
    onSnapshot(q, (snapshot) => {
        const adminsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Kirim fungsi renderHargaList sebagai callback!
        renderAdminSelection(adminsData, renderHargaList);
    });
}

// FUNGSI BARU UNTUK MENDENGARKAN DATA DI ADMIN PANEL
export function listenToAdminData() {
    const adminPcControls = document.getElementById('admin-pc-controls');
    onSnapshot(collection(db, 'pcs'), (snapshot) => {
        adminPcControls.innerHTML = '';
        const pcs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(pc => pc.name).sort((a,b) => a.name.localeCompare(b.name));
        pcs.forEach(pc => {
            let timerControlHTML = '';
            if (pc.status === 'DIGUNAKAN') {
                timerControlHTML = `<div class="flex items-center gap-2 mt-2"><input type="number" placeholder="Menit" class="w-20 bg-gray-800 text-white rounded p-1 text-center pc-timer-input"><button class="bg-blue-600 text-white px-2 py-1 rounded text-sm set-waktu-btn" data-id="${pc.id}">Set Waktu</button></div>`;
            }
            adminPcControls.innerHTML += `<div class="backdrop-blur-custom p-3 rounded-md border border-gray-700"><div class="flex items-center justify-between"><span class="font-bold">${pc.name}</span><select class="pc-status-select bg-gray-700 text-white rounded p-1" data-id="${pc.id}"><option value="READY" ${pc.status === 'READY' ? 'selected' : ''}>Ready</option><option value="DIGUNAKAN" ${pc.status === 'DIGUNAKAN' ? 'selected' : ''}>Digunakan</option><option value="OFFLINE" ${pc.status === 'OFFLINE' ? 'selected' : ''}>Offline</option></select></div>${timerControlHTML}</div>`;
        });
    });

    const adminTransaksiList = document.getElementById('admin-transaksi-list');
    const transQuery = query(collection(db, 'transactions'), orderBy("timestamp", "desc"), limit(20));
    onSnapshot(transQuery, (snapshot) => {
        adminTransaksiList.innerHTML = '';
        if (snapshot.empty) { adminTransaksiList.innerHTML = '<p class="text-center text-gray-400">Belum ada transaksi.</p>'; return; }
        snapshot.forEach(d => {
            const trx = { id: d.id, ...d.data() };
            adminTransaksiList.innerHTML += `<div class="backdrop-blur-custom p-3 rounded-md border border-gray-700"><p><strong>ID:</strong> ${trx.billingId} (${trx.userDisplayName})</p><p><strong>Item:</strong> ${trx.paket.nama}</p><select class="trx-status-select bg-gray-700 text-white rounded p-1 mt-2 w-full" data-id="${trx.id}" data-trx='${JSON.stringify(trx)}'><option value="Menunggu Pembayaran" ${trx.status === 'Menunggu Pembayaran' ? 'selected' : ''}>Menunggu</option><option value="Selesai" ${trx.status === 'Selesai' ? 'selected' : ''}>Selesai</option></select></div>`;
        });
    });

    const adminStatusControls = document.getElementById('admin-status-controls');
    onSnapshot(collection(db, 'admins'), (snapshot) => {
        adminStatusControls.innerHTML = '';
        const admins = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(admin => admin.name).sort((a,b) => a.name.localeCompare(b.name));
        admins.forEach(admin => {
            adminStatusControls.innerHTML += `<div class="flex items-center space-x-2"><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" value="" class="sr-only peer admin-online-toggle" data-id="${admin.id}" ${admin.isOnline ? 'checked' : ''}><div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div></label><span class="font-bold">${admin.name}</span></div>`;
        });
    });
}

// FUNGSI BARU UNTUK MENANGANI SEMUA AKSI TULIS/UPDATE DATA
export async function handleAdminActions(e) {
    const target = e.target;
    try {
        if (target.classList.contains('pc-status-select')) {
            await updateDoc(doc(db, 'pcs', target.dataset.id), { status: target.value, endTime: null });
            showToast(`Status PC berhasil diubah`, 'success');
        }
        if (target.classList.contains('trx-status-select')) {
            const trxData = JSON.parse(target.dataset.trx);
            await updateDoc(doc(db, 'transactions', target.dataset.id), { status: target.value });
            if (target.value === 'Selesai' && trxData.admin.role === 'reseller') {
                await addDoc(collection(db, 'usageLogs'), {
                    adminName: trxData.admin.name, keuntungan: trxData.keuntungan,
                    paketNama: trxData.paket.nama, userDisplayName: trxData.userDisplayName, timestamp: serverTimestamp()
                });
            }
            showToast(`Status transaksi berhasil diubah`, 'success');
        }
        if (target.classList.contains('admin-online-toggle')) {
            await updateDoc(doc(db, 'admins', target.dataset.id), { isOnline: target.checked });
            showToast(`Status admin berhasil diubah`, 'success');
        }
    } catch (err) {
        showToast('Gagal mengubah status.', 'error');
        console.error("Admin Action Error:", err);
    }
}

export async function handleUserActions(e, currentUser, selectedSewaData) {
     const target = e.target;
     try {
        if (target.classList.contains('set-waktu-btn')) {
            const pcId = target.dataset.id;
            const input = target.parentElement.querySelector('.pc-timer-input');
            const minutes = parseInt(input.value);
            if (!minutes || minutes <= 0) return showToast('Masukkan menit yang valid.', 'error');
            
            const endTime = new Date(Date.now() + minutes * 60 * 1000);
            await updateDoc(doc(db, 'pcs', pcId), { endTime: endTime });
            showToast(`Timer untuk ${minutes} menit berhasil diatur!`, 'success');
            input.value = '';
        }
     } catch(err) {
        showToast('Aksi gagal.', 'error');
        console.error("User Action Error:", err);
     }
}

