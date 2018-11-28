// Initialize Firebase
import firebase from 'firebase'

var config = {
  apiKey: process.env.FIRESTORE_API_KEY,
  authDomain: "dw-dump.firebaseapp.com",
  databaseURL: "https://dw-dump.firebaseio.com",
  projectId: "dw-dump",
  storageBucket: "dw-dump.appspot.com",
  messagingSenderId: "503835081413"
};

firebase.initializeApp(config);

export default firebase;
