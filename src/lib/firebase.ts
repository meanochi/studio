import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore"; // 1. הוסף ייבוא זה
// הנתונים האלו הם "תעודת הזהות" של האתר שלך מול גוגל
const firebaseConfig = {
  apiKey: "AIzaSyASF7deNn4S17yZLwUmMOU122LxjTI0ICU",
  authDomain: "family-cookbook-ajj0n.firebaseapp.com",
  projectId: "family-cookbook-ajj0n",
  storageBucket: "family-cookbook-ajj0n.appspot.com",
  messagingSenderId: "1001135814027",
  appId: "1:1001135814027:web:d56e2b5519b7eefdd2ab8e"
};

// אתחול המערכת - בודק אם היא כבר רצה כדי לא ליצור כפילויות
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, 
});