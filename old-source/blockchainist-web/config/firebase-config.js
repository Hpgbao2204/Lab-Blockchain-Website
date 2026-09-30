// Firebase config - Updated from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDiuF-ohaGRLERTMF4SrNMW-PNRRx3DN-g",
  authDomain: "test-82a9b.firebaseapp.com",
  projectId: "test-82a9b",
  storageBucket: "test-82a9b.firebasestorage.app",
  messagingSenderId: "243136097779",
  appId: "1:243136097779:web:e404266cc16bcaf1ca7686",
  measurementId: "G-G896TC2ZHY"
};

// Khởi tạo Firebase với error handling
try {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Firestore & Auth với error handling
let db, auth;

try {
  db = firebase.firestore();
  auth = firebase.auth();
  
  // Enable offline persistence for better performance
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => {
      console.log('✅ Offline persistence enabled');
    })
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code == 'unimplemented') {
        console.warn('⚠️ Browser doesn\'t support persistence.');
      }
    });
    
} catch (error) {
  console.error('❌ Firebase services initialization error:', error);
}

// Export for global access
window.db = db;
window.auth = auth;
