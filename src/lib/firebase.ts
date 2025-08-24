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
try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountString) {
        const serviceAccount = JSON.parse(serviceAccountString);
        if (admin.apps.length === 0) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              databaseURL: firebaseConfig.databaseURL,
            });
        }
        adminDb = admin.database();
    } else if (process.env.NODE_ENV !== 'development') {
        // Log a warning only if not in development, as it might be expected during local dev without a key.
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server-side admin features will be disabled.");
    }
} catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
    // Setting adminDb to undefined here ensures that checks for it will fail.
    adminDb = undefined;
}

export { adminDb };
