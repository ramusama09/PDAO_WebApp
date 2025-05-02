// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_lAk9dURcKIS4VIso_aT9d94K4BW7Plw",
  authDomain: "pdao-webapp.firebaseapp.com",
  databaseURL: "https://pdao-webapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pdao-webapp",
  storageBucket: "pdao-webapp.firebasestorage.app",
  messagingSenderId: "591949755858",
  appId: "1:591949755858:web:318d12c781ba40cf3fc40b",
  measurementId: "G-166L0DK5NG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const database = firebase.database(); 