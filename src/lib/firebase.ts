// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

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
const db = getDatabase(app);

export { db, app };
