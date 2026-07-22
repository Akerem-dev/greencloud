export const AUTOMATION_COMMAND_BLOCKED_EVENT =
  "greencloud:automation-command-blocked";

const LIMITS = Object.freeze({
  moistureThreshold: [15, 80],
  cooldownMinutes: [5, 120],
  pumpDurationSeconds: [2, 60],
});

const VALID_MODES = new Set(["Automatic", "Manual"]);
const CLOCK_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function clampFinite(value, [min, max], fallback) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function booleanOrFallback(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function clockOrFallback(value, fallback) {
  return typeof value === "string" && CLOCK_PATTERN.test(value)
    ? value
    : fallback;
}

export function normalizeAutomationPatch(current, patch) {
  const source = patch && typeof patch === "object" ? patch : {};

  const quietHoursStart = clockOrFallback(
    source.quietHoursStart ?? source.quietStart,
    current.quietHoursStart,
  );
  const quietHoursEnd = clockOrFallback(
    source.quietHoursEnd ?? source.quietEnd,
    current.quietHoursEnd,
  );
  const manualOverrideEnabled = booleanOrFallback(
    source.manualOverrideEnabled ?? source.manualOverride,
    current.manualOverrideEnabled,
  );

  return {
    mode: VALID_MODES.has(source.mode) ? source.mode : current.mode,
    moistureThreshold: clampFinite(
      source.moistureThreshold,
      LIMITS.moistureThreshold,
      current.moistureThreshold,
    ),
    cooldownMinutes: clampFinite(
      source.cooldownMinutes,
      LIMITS.cooldownMinutes,
      current.cooldownMinutes,
    ),
    pumpDurationSeconds: clampFinite(
      source.pumpDurationSeconds,
      LIMITS.pumpDurationSeconds,
      current.pumpDurationSeconds,
    ),
    manualOverrideEnabled,
    manualOverride: manualOverrideEnabled,
    autoIrrigationEnabled: booleanOrFallback(
      source.autoIrrigationEnabled,
      current.autoIrrigationEnabled,
    ),
    quietHoursEnabled: booleanOrFallback(
      source.quietHoursEnabled,
      current.quietHoursEnabled,
    ),
    quietHoursStart,
    quietHoursEnd,
    quietStart: quietHoursStart,
    quietEnd: quietHoursEnd,
  };
}

function containsBlockedSensorState(value) {
  const normalized = String(value ?? "").toLowerCase();
  return (
    normalized.includes("sensor check") ||
    normalized.includes("no signal") ||
    normalized.includes("offline")
  );
}

export function getManualIrrigationDecision({
  authenticated,
  hasRealDevice,
  manualOverrideEnabled,
  telemetryReady,
  deviceStatus,
  sensorStatus,
  rainStatus,
  waterLevelStatus,
}) {
  if (!authenticated) {
    return { allowed: false, reason: "Sign in before sending device commands." };
  }

  if (!hasRealDevice) {
    return { allowed: false, reason: "Pair a real device before sending commands." };
  }

  if (!manualOverrideEnabled) {
    return { allowed: false, reason: "Manual override is disabled." };
  }

  if (
    !telemetryReady ||
    deviceStatus === "Offline" ||
    containsBlockedSensorState(sensorStatus)
  ) {
    return {
      allowed: false,
      reason: "Reliable device telemetry is required before watering.",
    };
  }

  if (rainStatus === "Detected") {
    return { allowed: false, reason: "Watering is paused because rain is detected." };
  }

  if (waterLevelStatus === "Low" || waterLevelStatus === "Empty") {
    return { allowed: false, reason: "Water tank protection is active." };
  }

  return { allowed: true, reason: "Manual watering command is allowed." };
}
