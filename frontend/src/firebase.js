import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD1idpS4T10HwOoDDzUGiqP6TOPDpvwPJY",
  authDomain: "shipper-system-1.firebaseapp.com",
  projectId: "shipper-system-1",
  storageBucket: "shipper-system-1.firebasestorage.app",
  messagingSenderId: "780083689996",
  appId: "1:780083689996:web:1ed17e03f687af17920c29",
  measurementId: "G-93ZDBDMMDR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
