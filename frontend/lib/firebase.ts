// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBLWhdANkBUPD-lhITSUec-BbkSdWcoRuk",
    authDomain: "silence-booster.firebaseapp.com",
    projectId: "silence-booster",
    storageBucket: "silence-booster.firebasestorage.app",
    messagingSenderId: "57818108874",
    appId: "1:57818108874:web:e4c02de7c4d73c460af533",
    measurementId: "G-PT08STE7ML"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
