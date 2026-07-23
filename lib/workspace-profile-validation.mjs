export const WORKSPACE_IDENTITY_LIMITS = Object.freeze({
  profileName: 60,
  workspaceName: 80,
  projectName: 80,
  ownerName: 60,
  mainPlantLabel: 80,
});

const CONTROL_OR_BIDI_PATTERN =
  /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u;
const CONTROL_OR_BIDI_GLOBAL_PATTERN =
  /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/gu;

export class WorkspaceProfileValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "WorkspaceProfileValidationError";
    this.code = code;
  }
}

function asNormalizedString(value) {
  return typeof value === "string" ? value.normalize("NFC") : "";
}

function sliceCodePoints(value, maxLength) {
  return Array.from(value).slice(0, maxLength).join("");
}

function collapseWhitespace(value) {
  return value.trim().replace(/\s+/gu, " ");
}

function assertSafeText(value, label) {
  if (CONTROL_OR_BIDI_PATTERN.test(value)) {
    throw new WorkspaceProfileValidationError(
      `${label} contains unsupported control characters.`,
      "unsafe-characters",
    );
  }
}

function validateRequiredText(value, { label, maxLength }) {
  const normalized = asNormalizedString(value);
  assertSafeText(normalized, label);

  const cleaned = collapseWhitespace(normalized);

  if (!cleaned) {
    throw new WorkspaceProfileValidationError(
      `${label} is required.`,
      "required",
    );
  }

  if (Array.from(cleaned).length > maxLength) {
    throw new WorkspaceProfileValidationError(
      `${label} must be ${maxLength} characters or fewer.`,
      "too-long",
    );
  }

  return cleaned;
}

export function validateProfileName(value) {
  return validateRequiredText(value, {
    label: "Profile name",
    maxLength: WORKSPACE_IDENTITY_LIMITS.profileName,
  });
}

export function sanitizeLiveIdentityValue(value, maxLength) {
  const normalized = asNormalizedString(value).replace(
    CONTROL_OR_BIDI_GLOBAL_PATTERN,
    "",
  );

  return sliceCodePoints(normalized, maxLength);
}

function normalizeLiveField(value, fallback, maxLength) {
  if (typeof value !== "string") return fallback;
  return sanitizeLiveIdentityValue(value, maxLength);
}

export function normalizeIdentitySettingsPatch(current, patch) {
  const source = patch && typeof patch === "object" ? patch : {};
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(source, "workspaceName")) {
    normalized.workspaceName = normalizeLiveField(
      source.workspaceName,
      current.workspaceName,
      WORKSPACE_IDENTITY_LIMITS.workspaceName,
    );
  }

  if (Object.prototype.hasOwnProperty.call(source, "projectName")) {
    normalized.projectName = normalizeLiveField(
      source.projectName,
      current.projectName,
      WORKSPACE_IDENTITY_LIMITS.projectName,
    );
  }

  if (Object.prototype.hasOwnProperty.call(source, "ownerName")) {
    normalized.ownerName = normalizeLiveField(
      source.ownerName,
      current.ownerName,
      WORKSPACE_IDENTITY_LIMITS.ownerName,
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(source, "mainPlantLabel") ||
    Object.prototype.hasOwnProperty.call(source, "plantLabel")
  ) {
    const mainPlantLabel = normalizeLiveField(
      source.mainPlantLabel ?? source.plantLabel,
      current.mainPlantLabel,
      WORKSPACE_IDENTITY_LIMITS.mainPlantLabel,
    );

    normalized.mainPlantLabel = mainPlantLabel;
    normalized.plantLabel = mainPlantLabel;
  }

  return normalized;
}

function validateIdentityField(value, fallback, label, maxLength) {
  const normalized = asNormalizedString(value);

  if (!collapseWhitespace(normalized)) {
    return validateRequiredText(fallback, { label, maxLength });
  }

  return validateRequiredText(normalized, { label, maxLength });
}

export function validateWorkspaceIdentity(payload, current) {
  const source = payload && typeof payload === "object" ? payload : {};

  return {
    workspaceName: validateIdentityField(
      source.workspaceName,
      current.workspaceName,
      "Workspace name",
      WORKSPACE_IDENTITY_LIMITS.workspaceName,
    ),
    projectName: validateIdentityField(
      source.projectName,
      current.projectName,
      "Project name",
      WORKSPACE_IDENTITY_LIMITS.projectName,
    ),
    ownerName: validateIdentityField(
      source.ownerName,
      current.ownerName,
      "Owner name",
      WORKSPACE_IDENTITY_LIMITS.ownerName,
    ),
    mainPlantLabel: validateIdentityField(
      source.mainPlantLabel,
      current.mainPlantLabel,
      "Main plant label",
      WORKSPACE_IDENTITY_LIMITS.mainPlantLabel,
    ),
  };
}
