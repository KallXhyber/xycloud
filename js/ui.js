// File: js/ui.js
// Berisi semua fungsi yang berhubungan dengan manipulasi tampilan (DOM),
// seperti menampilkan halaman, notifikasi, dan merender data ke HTML.

// --- Variabel & Elemen UI ---
const pages = document.querySelectorAll('.page');
const mobileMenu = document.getElementById('mobile-menu');
const toastContainer = document.getElementById('toast-container');
const successSound = document.getElementById('success-sound');
const errorSound = document.getElementById('error-sound');

// --- Fungsi Utilitas UI ---
export function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    const newPage = document.getElementById(pageId);
    if (newPage) newPage.classList.add('active');
    window.scrollTo(0, 0);
    mobileMenu.classList.add('hidden');
}

export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-times-circle' : 'fa-info-circle');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    if (type === 'success') successSound.play().catch(e => {});
    else errorSound.play().catch(e => {});

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// --- Fungsi Update Tampilan Berdasarkan Data ---
export function updateUIForAuthState(user, isAdmin, displayName) {
    const loginContainer = document.getElementById('login-container');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    const profileLink = document.getElementById('profile-link');

    if (user) {
        loginContainer.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        userName.textContent = displayName;
        profileLink.classList.toggle('hidden', user.isAnonymous);
        adminPanelBtn.classList.toggle('hidden', !isAdmin);
    } else {
        loginContainer.classList.remove('hidden');
        userInfo.classList.add('hidden');
        adminPanelBtn.classList.add('hidden');
    }
}

export function renderPcMonitoring(pcData, countdownIntervals) {
    const pcMonitoringDiv = document.getElementById('pc-monitoring');
    const homeSewaButtonContainer = document.getElementById('home-sewa-button-container');
    pcMonitoringDiv.innerHTML = '';
    homeSewaButtonContainer.innerHTML = '';
    let isReadyPC = false;
    
    // Hapus interval lama sebelum membuat yang baru
    Object.values(countdownIntervals).forEach(clearInterval);

    if (!pcData || pcData.length === 0) {
        pcMonitoringDiv.innerHTML = '<p class="col-span-full text-center text-gray-400 backdrop-blur-custom p-4 rounded-lg">Belum ada PC yang dikonfigurasi.</p>';
        return;
    }

    pcData.forEach(pc => {
        const statusClass = pc.status === 'READY' ? 'bg-status-ready' : pc.status === 'DIGUNAKAN' ? 'bg-status-digunakan' : 'bg-status-offline';
        let timerHTML = `<p class="font-bold text-base">${pc.status}</p>`;

        if (pc.status === 'DIGUNAKAN' && pc.endTime) {
            const endTime = pc.endTime.toDate();
            const timerElementId = `timer-${pc.id}`;
            timerHTML = `<p id="${timerElementId}" class="font-bold text-base text-yellow-400">Menghitung...</p>`;
            
            countdownIntervals[pc.id] = setInterval(() => {
                const now = new Date();
                const distance = endTime - now;
                const timerEl = document.getElementById(timerElementId);
                if (timerEl) {
                    if (distance < 0) {
                        clearInterval(countdownIntervals[pc.id]);
                        timerEl.innerHTML = "Waktu Habis";
                        timerEl.classList.remove('text-yellow-400');
                        timerEl.classList.add('text-red-500');
                    } else {
                        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
                        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                        const seconds = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
                        timerEl.innerHTML = `${hours}:${minutes}:${seconds}`;
                    }
                }
            }, 1000);
        }

        pcMonitoringDiv.innerHTML += `<div class="backdrop-blur-custom rounded-lg shadow-lg flex flex-col"><div class="monitor-icon p-4"><div class="status-dot ${statusClass}"></div><div class="text-center"><i class="fas fa-desktop text-5xl text-gray-500"></i><p class="mt-2 text-base font-bold">${pc.name}</p></div></div><div class="p-2 text-center -mt-2">${timerHTML}</div><div class="mt-auto"><div class="monitor-stand"></div><div class="monitor-base"></div></div></div>`;
        if (pc.status === 'READY') isReadyPC = true;
    });

    if (isReadyPC) {
        homeSewaButtonContainer.innerHTML = `<button id="sewa-sekarang-btn" class="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-sky-600 transform hover:scale-105 transition-transform duration-300 shadow-lg">Sewa Sekarang <i class="fas fa-arrow-right ml-2"></i></button>`;
        document.getElementById('sewa-sekarang-btn').addEventListener('click', () => showPage('sewa'));
    } else {
        homeSewaButtonContainer.innerHTML = `<button class="bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg cursor-not-allowed" disabled>Semua PC Penuh</button>`;
    }
}
// Tambahkan fungsi render lainnya (renderAdmins, renderTransaksi, dll) di sini jika diperlukan
// ... (semua kode ui.js yang sudah ada sebelumnya) ...

// TAMBAHKAN FUNGSI INI DI PALING BAWAH
export function renderAdminSelection(adminsData) {
    const adminSelectionDiv = document.getElementById('admin-selection');
    adminSelectionDiv.innerHTML = '';
    if (!adminsData || adminsData.length === 0) return;

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
    const currentHour = now.getHours();

    adminsData.forEach(admin => {
        let isOnline = admin.isOnline;
        let scheduleText = admin.jadwal || 'Jadwal Fleksibel';
        
        if (admin.jamMulai && admin.jamSelesai) {
            const jamMulai = parseInt(admin.jamMulai.split(':')[0]);
            const jamSelesai = parseInt(admin.jamSelesai.split(':')[0]);
            scheduleText = `${admin.jamMulai} - ${admin.jamSelesai} WITA`;

            if (jamMulai > jamSelesai) { // Logika untuk jadwal yang melewati tengah malam
                isOnline = currentHour >= jamMulai || currentHour < jamSelesai;
            } else {
                isOnline = currentHour >= jamMulai && currentHour < jamSelesai;
            }
        }

        const statusClass = isOnline ? 'bg-green-500' : 'bg-red-500';
        const statusText = isOnline ? 'Online' : 'Offline';

        adminSelectionDiv.innerHTML += `
            <div class="admin-card backdrop-blur-custom p-6 rounded-lg shadow-lg cursor-pointer hover:border-sky-500 transition-all" data-admin-id="${admin.id}">
                <div class="flex items-center">
                    <div class="relative">
                        <i class="fas fa-user-circle text-4xl text-gray-400"></i>
                        <span class="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ${statusClass} ring-2 ring-gray-800"></span>
                    </div>
                    <div class="ml-4">
                        <h4 class="text-xl font-bold">${admin.name}</h4>
                        <p class="text-sm font-semibold ${isOnline ? 'text-green-400' : 'text-red-400'}">${statusText}</p>
                        <p class="text-xs text-gray-400 mt-1">${scheduleText}</p>
                    </div>
                </div>
            </div>`;
    });

    // Tambahkan event listener setelah semua card dibuat
    document.querySelectorAll('.admin-card').forEach(card => {
        card.addEventListener('click', () => {
            const adminId = card.dataset.adminId;
            const selectedAdmin = adminsData.find(a => a.id === adminId);
            // Logika untuk menampilkan harga berdasarkan admin yang dipilih perlu ditambahkan di sini
            console.log("Admin dipilih:", selectedAdmin); 
            document.querySelectorAll('.admin-card').forEach(c => c.classList.remove('border-sky-500', 'bg-gray-700/50'));
            card.classList.add('border-sky-500', 'bg-gray-700/50');
        });
    });
}


