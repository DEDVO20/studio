'use client';

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, type UserCredential } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Creates a new user in Firebase Auth without signing out the current user.
 * This is achieved by using a temporary, secondary Firebase app instance.
 *
 * @param email The new user's email.
 * @param password The new user's password.
 * @returns A promise that resolves with the UserCredential of the newly created user.
 */
export async function createUserInSecondaryApp(email: string, password: string): Promise<UserCredential> {
  const tempAppName = `temp-user-creation-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    // After user is created, we don't need the temp app anymore.
    await deleteApp(tempApp);
    return userCredential;
  } catch (error) {
    // Ensure the temp app is cleaned up on failure as well.
    try {
        await deleteApp(tempApp);
    } catch (deleteError) {
        console.error("Failed to delete temporary Firebase app:", deleteError);
    }
    throw error;
  }
}
