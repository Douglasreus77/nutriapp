import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYhwMVyypnp4C3JsbzhFcZjYTbNPnhPzw",
  authDomain: "nutriapp-2e109.firebaseapp.com",
  projectId: "nutriapp-2e109",
  storageBucket: "nutriapp-2e109.firebasestorage.app",
  messagingSenderId: "763439692914",
  appId: "1:763439692914:web:f7eb70e28db0b8146f16eb",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
