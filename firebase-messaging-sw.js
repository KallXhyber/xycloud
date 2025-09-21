// Isi untuk file: firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// Inisialisasi Firebase dengan konfigurasi Anda
const firebaseConfig = { apiKey: "AIzaSyCXUy_NPBoC4scskd6tRJNoJtR0NRAfTJ8", authDomain: "xycloud-531d2.firebaseapp.com", projectId: "xycloud-531d2", storageBucket: "xycloud-531d2.appspot.com", messagingSenderId: "528538517556", appId: "1:52853851756:web:3bd4ac8f6dbd9ad52c8a61", measurementId: "G-Z02Z4EEKY4" };

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handler untuk notifikasi yang diterima saat website tidak dibuka (background)
messaging.onBackgroundMessage((payload) => {
  console.log("Menerima notifikasi background ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://i.ibb.co/rpJ9s3s/logo-1.png' // URL Ikon notifikasi Anda
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
