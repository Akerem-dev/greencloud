export const SETTINGS_PREFERENCE_BLOCKED_EVENT =
  "greencloud:settings-preference-blocked";

const THEME_PRESETS = new Set([
  "botanical-dark",
  "forest-mist",
  "aurora-gold",
  "midnight-moss",
  "golden-hour",
  "rain-glass",
]);

const NOTIFICATION_MODES = new Set(["priority", "all"]);
const AMBIENCE_MODES = new Set([
  "leaves",
  "rain",
  "mist",
  "wind",
  "fireflies",
  "calm",
]);

const IDENTITY_KEYS = new Set([
  "workspaceName",
  "projectName",
  "ownerName",
  "mainPlantLabel",
  "plantLabel",
]);

const PREFERENCE_KEYS = new Set([
  "themePreset",
  "theme",
  "notificationMode",
  "notifications",
  "animations",
  "compactMode",
  "leafAmbience",
  "leafFx",
  "ambienceMode",
]);

const KNOWN_SETTINGS_KEYS = new Set([
  ...IDENTITY_KEYS,
  ...PREFERENCE_KEYS,
]);

export class SettingsPreferenceValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "SettingsPreferenceValidationError";
    this.code = code;
  }
}

function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function assertPatchObject(patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new SettingsPreferenceValidationError(
      "Settings changes must be provided as a settings object.",
      "invalid-patch",
    );
  }

  return patch;
}

function assertKnownKeys(source) {
  const unknownKeys = Object.keys(source).filter(
    (key) => !KNOWN_SETTINGS_KEYS.has(key),
  );

  if (unknownKeys.length > 0) {
    throw new SettingsPreferenceValidationError(
      `Unsupported settings field: ${unknownKeys[0]}.`,
      "unknown-field",
    );
  }
}

function resolveAlias(source, primaryKey, aliasKey) {
  const hasPrimary = hasOwn(source, primaryKey);
  const hasAlias = hasOwn(source, aliasKey);

  if (!hasPrimary && !hasAlias) return undefined;

  const primaryValue = source[primaryKey];
  const aliasValue = source[aliasKey];

  if (hasPrimary && hasAlias && primaryValue !== aliasValue) {
    throw new SettingsPreferenceValidationError(
      `${primaryKey} and ${aliasKey} must use the same value.`,
      "alias-conflict",
    );
  }

  return hasPrimary ? primaryValue : aliasValue;
}

function assertEnum(value, allowed, label) {
  if (typeof value !== "string" || !allowed.has(value)) {
    throw new SettingsPreferenceValidationError(
      `${label} is not supported.`,
      "invalid-enum",
    );
  }

  return value;
}

function assertBoolean(value, label) {
  if (typeof value !== "boolean") {
    throw new SettingsPreferenceValidationError(
      `${label} must be true or false.`,
      "invalid-boolean",
    );
  }

  return value;
}

export function normalizeSettingsPreferencePatch(current, patch) {
  const source = assertPatchObject(patch);
  assertKnownKeys(source);

  const normalized = {};

  const themePreset = resolveAlias(source, "themePreset", "theme");
  if (themePreset !== undefined) {
    const safeTheme = assertEnum(themePreset, THEME_PRESETS, "Theme preset");
    normalized.themePreset = safeTheme;
    normalized.theme = safeTheme;
  }

  const notificationMode = resolveAlias(
    source,
    "notificationMode",
    "notifications",
  );
  if (notificationMode !== undefined) {
    const safeMode = assertEnum(
      notificationMode,
      NOTIFICATION_MODES,
      "Notification mode",
    );
    normalized.notificationMode = safeMode;
    normalized.notifications = safeMode;
  }

  const leafAmbience = resolveAlias(source, "leafAmbience", "leafFx");
  if (leafAmbience !== undefined) {
    const safeLeafAmbience = assertBoolean(leafAmbience, "Ambient layer");
    normalized.leafAmbience = safeLeafAmbience;
    normalized.leafFx = safeLeafAmbience;
  }

  if (hasOwn(source, "animations")) {
    normalized.animations = assertBoolean(source.animations, "Animations");
  }

  if (hasOwn(source, "compactMode")) {
    normalized.compactMode = assertBoolean(source.compactMode, "Compact mode");
  }

  if (hasOwn(source, "ambienceMode")) {
    normalized.ambienceMode = assertEnum(
      source.ambienceMode,
      AMBIENCE_MODES,
      "Ambience mode",
    );
  }

  if (
    normalized.ambienceMode === "calm" &&
    !hasOwn(source, "leafAmbience") &&
    !hasOwn(source, "leafFx")
  ) {
    normalized.leafAmbience = false;
    normalized.leafFx = false;
  }

  if (
    normalized.leafAmbience === false &&
    !hasOwn(source, "ambienceMode") &&
    current?.ambienceMode === "calm"
  ) {
    normalized.ambienceMode = "calm";
  }

  return normalized;
}
