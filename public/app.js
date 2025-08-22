// Import necessary functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app); // Initialize the database
const auth = getAuth(app); // Initialize Firebase Authentication

// Function to handle Google login
function googleLogin() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      document.writeln(`Hello ${user.displayName}`);
      console.log(user);

      // Now write user data to the database
      writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    })
    .catch(console.log);
}

// Function to write user data to Firebase Realtime Database
function writeUserData(userID, name, email, imageUrl) {
  const reference = ref(db, 'users/' + userID);  // Use userID to write to the correct path

  set(reference, {
    username: name,
    email: email,
    profile_picture: imageUrl
  })
  .then(() => {
    console.log('User data has been written successfully!');
  })
  .catch((error) => {
    console.error('Error writing data: ', error);
  });
}
