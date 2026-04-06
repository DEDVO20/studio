'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    // If already initialized, return the SDKs with the already initialized App
    return getSdks(getApp());
  }

  let firebaseApp;

  // When in development, we can safely assume we want to use the local config file.
  // This avoids the "Automatic initialization failed" warning in the console.
  if (process.env.NODE_ENV !== 'production') {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    // In production, we first try the automatic initialization which is required for
    // Firebase App Hosting. If that fails (e.g., on Vercel), we fall back.
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      console.warn('Firebase automatic initialization failed, falling back to config object. This is expected on platforms other than Firebase App Hosting.');
      firebaseApp = initializeApp(firebaseConfig);
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
