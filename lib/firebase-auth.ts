import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

export type GreenCloudAuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export type AuthMode = "login" | "register";

export function mapFirebaseUser(user: User): GreenCloudAuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

export function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";

  if (code === "auth/invalid-email") {
    return "Invalid email format.";
  }

  if (code === "auth/missing-password") {
    return "Password is required.";
  }

  if (code === "auth/weak-password") {
    return "Password is too weak. Use at least 6 characters.";
  }

  if (code === "auth/email-already-in-use") {
    return "An account already exists with this email.";
  }

  if (code === "auth/user-not-found") {
    return "No account was found with this email.";
  }

  if (code === "auth/wrong-password") {
    return "Incorrect password.";
  }

  if (code === "auth/invalid-credential") {
    return "Email or password is incorrect.";
  }

  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait and try again.";
  }

  if (code === "auth/network-request-failed") {
    return "Network connection or Firebase access failed.";
  }

  return "Authentication failed. Please check your details and try again.";
}

export function subscribeToAuthState(
  onChange: (user: GreenCloudAuthUser | null) => void,
  onError?: (error: Error) => void,
) {
  return onAuthStateChanged(
    firebaseAuth,
    (user) => {
      onChange(user ? mapFirebaseUser(user) : null);
    },
    (error) => {
      onError?.(error);
      onChange(null);
    },
  );
}

export async function registerWithEmailPassword({
  email,
  password,
  displayName,
}: {
  email: string;
  password: string;
  displayName?: string;
}) {
  const cleanEmail = email.trim();
  const cleanDisplayName = displayName?.trim();

  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    cleanEmail,
    password,
  );

  if (cleanDisplayName) {
    await updateProfile(credential.user, {
      displayName: cleanDisplayName,
    });
  }

  return {
    uid: credential.user.uid,
    email: credential.user.email,
    displayName: cleanDisplayName || credential.user.displayName,
  };
}

export async function loginWithEmailPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password,
  );

  return mapFirebaseUser(credential.user);
}

export async function updateCurrentUserDisplayName(displayName: string) {
  const cleanDisplayName = displayName.trim();

  if (!cleanDisplayName) {
    throw new Error("Profile name is required.");
  }

  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new Error("You must be signed in to update your profile.");
  }

  await updateProfile(user, {
    displayName: cleanDisplayName,
  });

  return {
    uid: user.uid,
    email: user.email,
    displayName: cleanDisplayName,
  };
}

export async function logoutFromGreenCloud() {
  await signOut(firebaseAuth);
}

export function getCurrentGreenCloudUser() {
  const user = firebaseAuth.currentUser;

  return user ? mapFirebaseUser(user) : null;
}