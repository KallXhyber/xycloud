// File: js/main.js
// Versi ini sudah dilengkapi dengan logika untuk Music Player dan Tutorial.

import { initializeFirebase } from './firebase-init.js';
import { showPage, updateUIForAuthState } from './ui.js';
import { monitorAuthState, setupAuthEventListeners } from './auth.js';
import { listenToPcs, listenToAdmins } from './firestore.js';

function setupBaseEventListeners() {
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
}

function setupMusicPlayer() {
    const playlist = [
        { title: "Lost in Space", artist: "MILL WEST", src: "https://f.top4top.io/m_3549csq8c0.mp3" },
        { title: "Ambient Background", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }
    ];
    let currentTrackIndex = 0;

    const mainAudioPlayer = document.getElementById('main-audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn'),
          nextBtn = document.getElementById('next-track-btn'),
          prevBtn = document.getElementById('prev-track-btn');
    const trackTitleEl = document.getElementById('track-title'),
          trackArtistEl = document.getElementById('track-artist');
    const musicPlayerEl = document.getElementById('music-player'),
          minimizePlayerBtn = document.getElementById('minimize-player-btn'),
          minimizedIcon = document.getElementById('minimized-icon');
    const volumeSlider = document.getElementById('volume-slider');

    function loadTrack(index) {
        const track = playlist[index];
        trackTitleEl.textContent = track.title;
        trackArtistEl.textContent = track.artist;
        mainAudioPlayer.src = track.src;
        mainAudioPlayer.volume = volumeSlider.value / 100;
    }

    function playTrack() {
        mainAudioPlayer.play().catch(e => console.error("Audio play failed:", e));
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    function pauseTrack() {
        mainAudioPlayer.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

    playPauseBtn.addEventListener('click', () => { mainAudioPlayer.paused ? playTrack() : pauseTrack(); });
    nextBtn.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        playTrack();
    });
    prevBtn.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrackIndex);
        playTrack();
    });
    volumeSlider.addEventListener('input', (e) => { mainAudioPlayer.volume = e.target.value / 100; });
    mainAudioPlayer.addEventListener('ended', () => nextBtn.click());
    minimizePlayerBtn.addEventListener('click', () => musicPlayerEl.classList.add('minimized'));
    minimizedIcon.addEventListener('click', () => musicPlayerEl.classList.remove('minimized'));
    
    loadTrack(currentTrackIndex);
}

function renderTutorials() {
    const tutorialVideosData = [
        { title: 'TUTORIAL MAIN FIVEM', link: 'coming soon' },
        { title: 'TUTORIAL BUAT AKUN DISCORD', link: 'https://youtu.be/KAuhg-6kXhY?si=8PiS7mxwtSY4QmxP' },
        { title: 'TUTORIAL BUAT AKUN STEAM', link: 'https://youtu.be/4kPkifr2ZUI?si=jbhoi6RHUxpORSoa' },
        { title: 'TUTORIAL BUAT AKUN CFX.RE', link: 'coming soon' },
        { title: 'TUTORIAL ON MIC DI PC DEEPLINK', link: 'https://youtu.be/0PY7c_1FaoM?si=uyZvwTUMjZiU9BaE' },
        { title: 'ON MIC ANDROID', link: 'coming soon' }
    ];
    const videoContainer = document.getElementById('tutorial-videos');
    videoContainer.innerHTML = '';
    tutorialVideosData.forEach(video => {
        const isComingSoon = video.link === 'coming soon';
        const cardHTML = `
            <div class="backdrop-blur-custom rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div class="relative h-40 bg-gray-800 flex items-center justify-center">
                    <i class="fab fa-youtube text-5xl text-red-500"></i>
                    ${isComingSoon ? '<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><span class="text-white font-bold">SEGERA HADIR</span></div>' : ''}
                </div>
                <div class="p-4 flex-grow flex flex-col">
                    <h3 class="font-bold text-white flex-grow">${video.title}</h3>
                    ${isComingSoon ? '<button class="mt-4 w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed" disabled>Tonton</button>' : `<a href="${video.link}" target="_blank" class="mt-4 block text-center w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Tonton</a>`}
                </div>
            </div>`;
        videoContainer.innerHTML += cardHTML;
    });
}


async function startApp() {
    try {
        await initializeFirebase();
        setupBaseEventListeners();
        setupAuthEventListeners();
        monitorAuthState(updateUIForAuthState);
        
        listenToPcs();
        listenToAdmins();
        
        // Jalankan fungsi yang baru ditambahkan
        setupMusicPlayer();
        renderTutorials();

        showPage('home');
        console.log("Aplikasi XyCloud berhasil dimuat dan dijalankan.");
    } catch (error) {
        console.error("Gagal menjalankan aplikasi:", error);
    }
}

document.addEventListener('DOMContentLoaded', startApp);

