import {
  WorkspaceProfileValidationError,
  validateProfileName,
} from "./workspace-profile-validation.mjs";

export const AUTH_SESSION_BLOCKED_EVENT =
  "greencloud:auth-session-blocked";

export const AUTH_INPUT_LIMITS = Object.freeze({
  email: 254,
  password: 4096,
});

const CONTROL_OR_BIDI_PATTERN =
  /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u;

export class AuthSessionIntegrityError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AuthSessionIntegrityError";
    this.code = code;
  }
}

function assertPayloadObject(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AuthSessionIntegrityError(
      "Authentication details must be provided as an object.",
      "invalid-payload",
    );
  }

  return payload;
}

export function normalizeAuthEmail(value) {
  if (typeof value !== "string") {
    throw new AuthSessionIntegrityError(
      "Email is required.",
      "invalid-email",
    );
  }

  const normalized = value.normalize("NFC");

  if (CONTROL_OR_BIDI_PATTERN.test(normalized)) {
    throw new AuthSessionIntegrityError(
      "Email contains unsupported control characters.",
      "unsafe-email",
    );
  }

  const cleaned = normalized.trim();

  if (!cleaned) {
    throw new AuthSessionIntegrityError(
      "Email is required.",
      "invalid-email",
    );
  }

  if (Array.from(cleaned).length > AUTH_INPUT_LIMITS.email) {
    throw new AuthSessionIntegrityError(
      `Email must be ${AUTH_INPUT_LIMITS.email} characters or fewer.`,
      "email-too-long",
    );
  }

  return cleaned;
}

export function validateAuthPassword(value) {
  if (typeof value !== "string") {
    throw new AuthSessionIntegrityError(
      "Password is required.",
      "invalid-password",
    );
  }

  if (value.length < 6) {
    throw new AuthSessionIntegrityError(
      "Password is too weak. Use at least 6 characters.",
      "weak-password",
    );
  }

  if (value.length > AUTH_INPUT_LIMITS.password) {
    throw new AuthSessionIntegrityError(
      `Password must be ${AUTH_INPUT_LIMITS.password} characters or fewer.`,
      "password-too-long",
    );
  }

  return value;
}

export function normalizeAuthDisplayName(value) {
  try {
    return validateProfileName(value);
  } catch (error) {
    if (error instanceof WorkspaceProfileValidationError) {
      throw new AuthSessionIntegrityError(
        error.message,
        "invalid-display-name",
      );
    }

    throw error;
  }
}

export function normalizeAuthLoginInput(payload) {
  const source = assertPayloadObject(payload);

  return {
    email: normalizeAuthEmail(source.email),
    password: validateAuthPassword(source.password),
  };
}

export function normalizeAuthRegistrationInput(payload) {
  const source = assertPayloadObject(payload);

  return {
    email: normalizeAuthEmail(source.email),
    password: validateAuthPassword(source.password),
    displayName: normalizeAuthDisplayName(source.displayName),
  };
}

export function assertFirebaseAuthSessionOnly() {
  throw new AuthSessionIntegrityError(
    "Workspace sessions can only be created by Firebase Authentication.",
    "firebase-auth-required",
  );
}
