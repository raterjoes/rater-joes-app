// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDFGUncdKL-5_DD3_11e05HKBqrQWMDzSU",
  authDomain: "rater-joes.firebaseapp.com",
  projectId: "rater-joes",
  storageBucket: "rater-joes.firebasestorage.app",
  messagingSenderId: "679567127281",
  appId: "1:679567127281:web:bac0ccb4b6656defdfaf50"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);