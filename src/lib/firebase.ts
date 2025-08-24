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
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db = getDatabase(app);

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : undefined;

if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: firebaseConfig.databaseURL,
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error', error);
  }
}

export const adminDb = admin.apps.length ? admin.database() : undefined;
