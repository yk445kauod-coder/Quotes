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
  storageBucket: "maher-project.appspot.com",
  messagingSenderId: "266963974491",
  appId: "1:266963974491:web:ebe7c920ca34bdbcea027e"
};


// Initialize Firebase client SDK
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Initialize Firebase Admin SDK
let adminDb: admin.database.Database | undefined;

function initializeAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server-side admin features will be disabled.");
        return;
    }
    
    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: firebaseConfig.databaseURL,
        });
    } catch (error) {
        console.error('Firebase Admin Initialization Error from JSON parsing:', error);
        return;
    }
}

const adminApp = initializeAdmin();
if (adminApp) {
    adminDb = admin.database();
}


export { adminDb };
