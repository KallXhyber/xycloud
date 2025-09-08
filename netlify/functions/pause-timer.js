const admin = require('firebase-admin');

// Inisialisasi Firebase Admin SDK dari Environment Variables
// Pastikan Anda sudah mengatur variabel ini di Netlify UI
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

exports.handler = async function(event, context) {
  // Hanya izinkan metode POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const slotId = body.slotId; // Misal: 'pc_slot_1'

    if (!slotId) {
      return { statusCode: 400, body: 'Bad Request: slotId is required.' };
    }

    const sessionRef = db.collection('active_sessions').doc(slotId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists || !sessionDoc.data().isActive) {
      return { statusCode: 200, body: `Session for ${slotId} is not active. No action taken.` };
    }

    const sessionData = sessionDoc.data();
    const userId = sessionData.userId;
    const endTime = sessionData.endTime.toDate();
    const now = new Date();
    
    // Hitung sisa waktu dalam detik
    const remainingSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);

    if (remainingSeconds > 0) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const currentSavedTime = userDoc.data().savedTimeSeconds || 0;
        await userRef.update({
          savedTimeSeconds: currentSavedTime + remainingSeconds,
        });
      }
    }

    // Kosongkan slot
    await sessionRef.update({
      isActive: false,
      userId: null,
      packageName: null,
      startTime: null,
      endTime: null,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Session for ${slotId} paused successfully. ${remainingSeconds} seconds saved.` }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error.' }),
    };
  }
};

