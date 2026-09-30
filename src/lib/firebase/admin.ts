import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

type AdminConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

function readAdminConfig(): AdminConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: rawPrivateKey.replace(/\\n/g, "\n")
  };
}

export function hasFirebaseAdminConfig() {
  return readAdminConfig() !== null;
}

export function getFirebaseAdminApp(): App | null {
  if (cachedApp) {
    return cachedApp;
  }

  const existingApp = getApps()[0];
  if (existingApp) {
    cachedApp = existingApp;
    return cachedApp;
  }

  const config = readAdminConfig();
  if (!config) {
    return null;
  }

  cachedApp = initializeApp({
    credential: cert(config),
    projectId: config.projectId
  });

  return cachedApp;
}

export function getAdminDb(): Firestore | null {
  if (cachedDb) {
    return cachedDb;
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  cachedDb = getFirestore(app);
  return cachedDb;
}

export function getAdminAuth(): Auth | null {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  cachedAuth = getAuth(app);
  return cachedAuth;
}
