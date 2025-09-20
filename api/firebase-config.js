// File: api/firebase-config.js
export default function handler(request, response) {
  const config = {
    apiKey: process.env.VITE_PUBLIC_API_KEY,
    authDomain: process.env.VITE_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.VITE_PUBLIC_PROJECT_ID,
    storageBucket: process.env.VITE_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.VITE_PUBLIC_APP_ID,
    measurementId: process.env.VITE_PUBLIC_MEASUREMENT_ID,
  };
  
  // Mengirim konfigurasi sebagai JSON
  response.status(200).json(config);
}
