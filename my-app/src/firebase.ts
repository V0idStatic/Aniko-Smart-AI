// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCN8R8w5wSY6omSBbr8KOnEpXLQu_1aw18",
  authDomain: "aniko-smart-ai.firebaseapp.com",
  databaseURL: "https://aniko-smart-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aniko-smart-ai",
  storageBucket: "aniko-smart-ai.firebasestorage.app",
  messagingSenderId: "128929125916",
  appId: "1:128929125916:web:5f07d85d749af3034ab1d9",
  measurementId: "G-E39VS579EB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
