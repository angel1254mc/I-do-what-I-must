// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNJhJoLeGG4IcCchTd4BqayDVthf0f40o",
  authDomain: "voxel-jump.firebaseapp.com",
  databaseURL: "https://voxel-jump-default-rtdb.firebaseio.com",
  projectId: "voxel-jump",
  storageBucket: "voxel-jump.appspot.com",
  messagingSenderId: "147244367162",
  appId: "1:147244367162:web:c6f8485f2a4aea79062403",
  measurementId: "G-7V2KW1QLNM"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
