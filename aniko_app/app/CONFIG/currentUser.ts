// Simple in-memory current user holder. Survives across screens during app runtime.
// If you need persistence across app restarts, replace with AsyncStorage or SecureStore.

export interface AppUserSession {
  id: number;          // internal users.id (integer)
  username: string;
  last_login?: string | null;
}

let currentUser: AppUserSession | null = null;

export function setCurrentUser(user: AppUserSession) {
  currentUser = user;
}

export function getCurrentUser(): AppUserSession | null {
  return currentUser;
}

export function clearCurrentUser() {
  currentUser = null;
}
