// File: js/firestore.js
// Versi ini sudah dihubungkan dengan fungsi render di ui.js

import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    limit,
    where
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase-init.js';
import { renderPcMonitoring, renderAdminSelection } from './ui.js';

let countdownIntervals = {};

export function listenToPcs() {
    const pcsCollection = collection(db, 'pcs');
    const q = query(pcsCollection, orderBy('name'));
    
    onSnapshot(q, (snapshot) => {
        const pcData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPcMonitoring(pcData, countdownIntervals);
    });
}

export function listenToAdmins() {
    const adminsCollection = collection(db, 'admins');
    const q = query(adminsCollection, orderBy('name'));

    onSnapshot(q, (snapshot) => {
        const adminsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // PANGGIL FUNGSI RENDER DI SINI
        renderAdminSelection(adminsData);
    });
}

