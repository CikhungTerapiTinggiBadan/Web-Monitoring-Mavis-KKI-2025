import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; 

// copy dari project settings di firebase 

const firebaseConfig = {
  apiKey: " ",
  authDomain: "pentolpentol-pentol.firebaseapp.com",
  databaseURL: " ",
  projectId: " ",
  storageBucket: " ",
  messagingSenderId: " ",
  appId: " ",
  measurementId: " "
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db }; 