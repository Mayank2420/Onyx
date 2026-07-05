// ============================================================
// ONYX PC STUDIO — Firebase initialisation (shared across pages)
// Uses the compat SDK so it can be dropped in with plain <script> tags
// (no build step / bundler needed) — matches the HTML/CSS/JS stack.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCfFbyjZ9RryJTFCqyTtStysL9IQgkrXbo",
  authDomain: "gaming-pc-6e69a.firebaseapp.com",
  projectId: "gaming-pc-6e69a",
  storageBucket: "gaming-pc-6e69a.firebasestorage.app",
  messagingSenderId: "659512467602",
  appId: "1:659512467602:web:c72cb4f1de43f96806864b",
  measurementId: "G-YXFCC9ZSD0"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Collection name used throughout the site
const PRODUCTS_COLLECTION = "products";
