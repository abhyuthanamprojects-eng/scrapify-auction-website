import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBncb3PtpjdOIE4xeq2L5hUoQ1VTq-E4bs",
  authDomain: "scrapify-auction.firebaseapp.com",
  projectId: "scrapify-auction",
  storageBucket: "scrapify-auction.firebasestorage.app",
  messagingSenderId: "1042418024481",
  appId: "1:1042418024481:web:2194b9f42c7a5852252360",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
