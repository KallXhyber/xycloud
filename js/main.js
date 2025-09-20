// File: js/main.js
// VERSI BARU: Sekarang mengimpor playlist dari file terpisah.

import { initializeFirebase, db } from './firebase-init.js';
import { showPage, updateUIForAuthState, showToast, renderHargaList } from './ui.js';
import { monitorAuthState, setupAuthEventListeners } from './auth.js';
import { listenToPcs, listenToAdmins, listenToAdminData, handleAdminActions, handleUserActions } from './firestore.js';
import { playlist } from './playlist.js'; // <-- IMPORT PLAYLIST DARI FILE BARU

let selectedSewaData = {};

function setupBaseEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.dataset.page);
        });
    });
    document.getElementById('mobile-menu-button').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });
    document.getElementById('admin-panel-btn').addEventListener('click', () => {
        showPage('admin-panel');
        listenToAdminData();
    });
}

function setupMusicPlayer() {
    // const playlist = [ ... ]; <-- BARIS INI DIHAPUS, KARENA SUDAH DIIMPOR DI ATAS
    let currentTrackIndex = 0;
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
}

function renderTutorials() {
    const tutorialVideosData = [ { title: 'TUTORIAL MAIN FIVEM', link: 'coming soon' }, { title: 'TUTORIAL BUAT AKUN DISCORD', link: 'https://youtu.be/KAuhg-6kXhY?si=8PiS7mxwtSY4QmxP' }, { title: 'TUTORIAL BUAT AKUN STEAM', link: 'https://youtu.be/4kPkifr2ZUI?si=jbhoi6RHUxpORSoa' }, { title: 'TUTORIAL BUAT AKUN CFX.RE', link: 'coming soon' }, { title: 'TUTORIAL ON MIC DI PC DEEPLINK', link: 'https://youtu.be/0PY7c_1FaoM?si=uyZvwTUMjZiU9BaE' }, { title: 'ON MIC ANDROID', link: 'coming soon' } ];
    const videoContainer = document.getElementById('tutorial-videos');
    videoContainer.innerHTML = '';
    tutorialVideosData.forEach(video => {
        const isComingSoon = video.link === 'coming soon';
        const cardHTML = `<div class="backdrop-blur-custom rounded-lg shadow-lg overflow-hidden flex flex-col"><div class="relative h-40 bg-gray-800 flex items-center justify-center"><i class="fab fa-youtube text-5xl text-red-500"></i> ${isComingSoon ? '<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><span class="text-white font-bold">SEGERA HADIR</span></div>' : ''}</div><div class="p-4 flex-grow flex flex-col"><h3 class="font-bold text-white flex-grow">${video.title}</h3> ${isComingSoon ? '<button class="mt-4 w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed" disabled>Tonton</button>' : `<a href="${video.link}" target="_blank" class="mt-4 block text-center w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Tonton</a>`}</div></div>`;
        videoContainer.innerHTML += cardHTML;
    });
}

function setupGlobalEventListeners() {
    document.body.addEventListener('input', (e) => {
        if (e.target.classList.contains('kustom-jam-input')) {
            const input = e.target;
            const hargaPerJam = parseInt(input.dataset.hargaPerJam);
            let jumlahJam = parseInt(input.value) || 1;
            if (jumlahJam < 1) { input.value = 1; jumlahJam = 1; }
            const totalHarga = hargaPerJam * jumlahJam;
            const display = input.closest('.flex.items-center.gap-4').querySelector('.total-harga-display');
            display.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalHarga);
        }
    });

    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        const currentUser = window.currentUser;

        if (target.closest('#beli-akun-btn')) {
            if (!currentUser || currentUser.isAnonymous) { document.getElementById('login-modal').classList.remove('hidden'); return; }
            document.getElementById('qris-title').textContent = "Beli Akun Rockstar";
            const billingId = `AKUN-${currentUser.uid.slice(0, 4)}-${Date.now().toString().slice(-4)}`;
            const waMessage = encodeURIComponent(`Halo, saya ingin konfirmasi pembayaran untuk pembelian Akun Rockstar dengan ID: ${billingId}`);
            document.getElementById('qris-instruction').innerHTML = `Tagihan Anda <strong class="text-white">${billingId}</strong>. Silahkan hubungi admin untuk konfirmasi.`;
            document.getElementById('whatsapp-link-qris').href = `https://wa.me/6283116632566?text=${waMessage}`;
            document.getElementById('qris-modal').classList.remove('hidden');
        }

        if (target.closest('.sewa-paket-btn') || target.closest('.sewa-kustom-btn')) {
            if (!currentUser || currentUser.isAnonymous) { document.getElementById('login-modal').classList.remove('hidden'); return; }
            const isKustom = target.closest('.sewa-kustom-btn');
            const btn = isKustom || target.closest('.sewa-paket-btn');
            let paketData;
            if (isKustom) {
                const container = btn.closest('.backdrop-blur-custom');
                const inputJam = container.querySelector('.kustom-jam-input');
                const jumlahJam = parseInt(inputJam.value) || 1;
                const hargaPerJam = parseInt(btn.dataset.hargaPerJam);
                paketData = { nama: `${jumlahJam} Jam (Kustom)`, harga: jumlahJam * hargaPerJam, durasi: jumlahJam * 60, };
            } else {
                paketData = { nama: btn.dataset.paketNama, harga: parseInt(btn.dataset.paketHarga), durasi: parseInt(btn.dataset.paketDurasi), };
            }
            const adminData = { id: btn.dataset.adminId, name: btn.dataset.adminName, whatsapp: btn.dataset.adminWhatsapp };
            selectedSewaData = { paket: paketData, admin: adminData };
            document.getElementById('whatsapp-input').value = '';
            document.getElementById('sewa-form-modal').classList.remove('hidden');
        }
        handleUserActions(e, currentUser, selectedSewaData);
    });

    document.getElementById('cancel-sewa-form').addEventListener('click', () => document.getElementById('sewa-form-modal').classList.add('hidden'));
    document.getElementById('close-qris-modal').addEventListener('click', () => document.getElementById('qris-modal').classList.add('hidden'));
    document.getElementById('submit-sewa-form').addEventListener('click', async () => {
        const waInput = document.getElementById('whatsapp-input').value;
        if (waInput.length !== 4 || !/^\d+$/.test(waInput)) return showToast('Mohon masukkan 4 digit angka yang valid.', 'error');
        const currentUser = window.currentUser;
        const billingId = `${waInput}-${Date.now().toString().slice(-6)}`;
        const transactionData = { ...selectedSewaData, billingId, status: 'Menunggu Pembayaran', userId: currentUser.uid, userDisplayName: currentUser.displayName, timestamp: serverTimestamp() };
        try {
            await addDoc(collection(db, 'transactions'), transactionData);
            document.getElementById('sewa-form-modal').classList.add('hidden');
            document.getElementById('qris-title').textContent = "Pembayaran Sewa";
            document.getElementById('qris-instruction').innerHTML = `Tagihan Anda <strong class="text-white">${billingId}</strong>. Silahkan hubungi admin <strong class="text-white">${selectedSewaData.admin.name}</strong> untuk konfirmasi.`;
            const message = encodeURIComponent(`Halo ${selectedSewaData.admin.name}, saya ingin konfirmasi pembayaran untuk sewa PC dengan Billing ID: ${billingId}.`);
            document.getElementById('whatsapp-link-qris').href = `https://wa.me/${selectedSewaData.admin.whatsapp}?text=${message}`;
            document.getElementById('qris-modal').classList.remove('hidden');
            showToast('Tagihan berhasil dibuat!');
        } catch (error) {
            console.error("Transaction Error: ", error);
            showToast('Gagal membuat transaksi.', 'error');
        }
    });
    document.body.addEventListener('change', (e) => handleAdminActions(e));
}

async function startApp() {
    try {
        await initializeFirebase();
        window.currentUser = null;
        monitorAuthState((user, isAdmin, displayName) => {
            window.currentUser = user;
            updateUIForAuthState(user, isAdmin, displayName);
        });
        setupBaseEventListeners();
        setupAuthEventListeners();
        setupGlobalEventListeners();
        listenToPcs();
        listenToAdmins();
        setupMusicPlayer();
        renderTutorials();
        showPage('home');
        console.log("Aplikasi XyCloud berhasil dimuat dan semua fungsi aktif.");
    } catch (error) {
        console.error("Gagal menjalankan aplikasi:", error);
    }
}

document.addEventListener('DOMContentLoaded', startApp);

