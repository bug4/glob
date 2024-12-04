import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHuCMu8437X5jUJ3h3HtbvnMHMxh0juYs",
  authDomain: "chattest-133d4.firebaseapp.com",
  projectId: "chattest-133d4",
  storageBucket: "chattest-133d4.firebasestorage.app",
  messagingSenderId: "136280116510",
  appId: "1:136280116510:web:777ac0a121d85bf507cd0f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);