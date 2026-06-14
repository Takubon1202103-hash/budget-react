import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyA0ZBn-MmLjTkQCU2sftAYrV4ial7THAfs",
  authDomain: "budget-app-60b0d.firebaseapp.com",
  projectId: "budget-app-60b0d",
  storageBucket: "budget-app-60b0d.firebasestorage.app",
  messagingSenderId: "756086809083",
  appId: "1:756086809083:web:bdc75f11c1571520b8ab5e"
}

const app = initializeApp(firebaseConfig)
export const db   = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
