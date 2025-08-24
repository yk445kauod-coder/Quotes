// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import admin from 'firebase-admin';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCGL0qAiIp9LiT6jO-Tsvz6v5efBJErFcc",
    authDomain: "maher-project.firebaseapp.com",
    databaseURL: "https://maher-project-default-rtdb.firebaseio.com",
    projectId: "maher-project",
    storageBucket: "maher-project.firebasestorage.app",
    messagingSenderId: "266963974491",
    appId: "1:266963974491:web:ebe7c920ca34bdbcea027e"
};


// Initialize Firebase client SDK
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Initialize Firebase Admin SDK - THIS PART IS PROBLEMATIC WITHOUT A SERVICE KEY
let adminDb: admin.database.Database | undefined;

function initializeAdmin() {
    if (admin.apps.length > 0) {
        adminDb = admin.database();
        return;
    }

    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server-side admin features that require it will be disabled.");
        return;
    }
    
    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: firebaseConfig.databaseURL,
        });
        adminDb = admin.database();
    } catch (error) {
        console.error('Firebase Admin Initialization Error from JSON parsing:', error);
    }
}

// We only run this on the server
if (typeof window === 'undefined') {
    initializeAdmin();
}


export { adminDb };
