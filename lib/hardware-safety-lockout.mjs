export const STALE_TELEMETRY_MS = 5 * 60 * 1000;

function normalized(value) {
  return String(value ?? "").trim().toLowerCase();
}

function hasOperationalEvidence(device) {
  const status = normalized(device?.status);
  const sensorStatus = normalized(device?.sensorStatus);
  const rainStatus = normalized(device?.rainStatus);
  const waterStatus = normalized(device?.waterLevelStatus);
  const commandStatus = normalized(device?.lastCommandStatus);

  return (
    status === "online" ||
    status === "syncing" ||
    status === "offline" ||
    typeof device?.lastSeenMs === "number" ||
    Number(device?.signal) > 0 ||
    (sensorStatus && sensorStatus !== "pending") ||
    (rainStatus && rainStatus !== "pending") ||
    (waterStatus && waterStatus !== "pending") ||
    (commandStatus && commandStatus !== "none" && commandStatus !== "pending")
  );
}

export function isTelemetryStale(device, nowMs = Date.now()) {
  const status = normalized(device?.status);
  const sensorStatus = normalized(device?.sensorStatus);

  if (status === "offline" || status === "syncing") return true;
  if (sensorStatus.includes("no signal") || sensorStatus.includes("offline")) {
    return true;
  }

  if (
    typeof device?.lastSeenMs === "number" &&
    device.lastSeenMs > 1_000_000_000_000 &&
    Number.isFinite(nowMs) &&
    nowMs - device.lastSeenMs > STALE_TELEMETRY_MS
  ) {
    return true;
  }

  return false;
}

function incident(id, severity, title, failed, prevented, safeState, inspectNext) {
  return {
    id,
    severity,
    title,
    failed,
    prevented,
    safeState,
    inspectNext,
  };
}

export function getHardwareSafetyLockout(device, nowMs = Date.now()) {
  if (!device || device.id === "device-waiting") {
    return { locked: false, incidents: [] };
  }

  const incidents = [];
  const status = normalized(device.status);
  const sensorStatus = normalized(device.sensorStatus);
  const rainStatus = normalized(device.rainStatus);
  const waterStatus = normalized(device.waterLevelStatus);
  const relayState = normalized(device.relayState);
  const pumpState = normalized(device.pumpState);
  const commandStatus = normalized(device.lastCommandStatus);
  const operationalEvidence = hasOperationalEvidence(device);

  if (isTelemetryStale(device, nowMs)) {
    incidents.push(
      incident(
        "telemetry",
        status === "offline" ? "danger" : "warning",
        status === "offline" ? "ESP32 connection unavailable" : "Telemetry is no longer current",
        status === "offline"
          ? "The trusted controller is not reporting a live device connection."
          : "The latest accepted hardware packet is syncing, missing or older than the five-minute safety window.",
        "Manual and automatic irrigation decisions cannot rely on the current field state.",
        "The web client keeps physical output closed rather than acting on stale evidence.",
        "Inspect controller power, Wi-Fi reachability and the timestamp of the next accepted telemetry packet.",
      ),
    );
  }

  const sensorFault =
    sensorStatus.includes("sensor check") ||
    sensorStatus.includes("fault") ||
    sensorStatus.includes("error") ||
    sensorStatus.includes("disconnected") ||
    (sensorStatus.includes("no signal") && status !== "offline");

  if (sensorFault) {
    incidents.push(
      incident(
        "soil-sensor",
        "danger",
        "Soil sensor evidence is unreliable",
        `The controller reports ${device.sensorStatus || "an unresolved soil sensor fault"}.`,
        "Moisture-based irrigation and manual watering approval are prevented.",
        "The relay remains protected because GreenCloud cannot confirm the soil condition.",
        "Inspect the soil probe wiring, power, ADC connection and the next raw-soil reading.",
      ),
    );
  }

  if (waterStatus === "low" || waterStatus === "empty") {
    incidents.push(
      incident(
        "water-level",
        waterStatus === "empty" ? "danger" : "warning",
        waterStatus === "empty" ? "Water reservoir is empty" : "Water reservoir is low",
        `The device reports the tank state as ${device.waterLevelStatus}.`,
        "Pump activation is prevented to avoid dry running or an incomplete irrigation cycle.",
        "The garden is protected from pump damage, but available water must be inspected manually.",
        "Refill the reservoir, inspect the level sensor and wait for a new OK telemetry state.",
      ),
    );
  }

  if (rainStatus === "detected" || device.rainDetected === true) {
    incidents.push(
      incident(
        "rain",
        "warning",
        "Rain lockout is active",
        "The field controller reports detected rain.",
        "Scheduled and manual watering are paused while natural watering is present.",
        "The garden is protected from unnecessary irrigation and runoff.",
        "Inspect the rain sensor only if the lockout remains after the sensor surface is dry.",
      ),
    );
  }

  if (operationalEvidence && relayState === "locked") {
    incidents.push(
      incident(
        "relay",
        "danger",
        "Relay output is locked",
        "The hardware record does not expose an enabled relay path.",
        "No irrigation command may energize the physical relay from this screen.",
        "The output path is fail-closed against unintended pump activation.",
        "Inspect safe mode, relay wiring, firmware protection state and the next controller packet.",
      ),
    );
  }

  const pumpProtected =
    operationalEvidence &&
    (device.safeMode === true ||
      device.pumpEnabled === false ||
      pumpState === "dry-run" ||
      pumpState === "blocked");

  if (pumpProtected) {
    const guards = [
      device.safeMode === true ? "safe mode" : "",
      device.pumpEnabled === false ? "pump disabled" : "",
      pumpState === "dry-run" ? "dry-run" : "",
      pumpState === "blocked" ? "blocked state" : "",
    ].filter(Boolean);

    incidents.push(
      incident(
        "pump",
        "danger",
        "Pump output is protected",
        `Active guard${guards.length === 1 ? "" : "s"}: ${guards.join(", ") || "hardware protection"}.`,
        "Physical pump activation is prevented even when a watering request exists.",
        "The system is output-safe; plant hydration still requires a field inspection.",
        "Verify the pump enable profile, safe-mode switch, relay supply and firmware state before clearing the guard.",
      ),
    );
  }

  if (commandStatus === "blocked") {
    incidents.push(
      incident(
        "command",
        "danger",
        "The latest irrigation command was blocked",
        device.lastCommand
          ? `The device reports ${device.lastCommand} as blocked.`
          : "The device reports a blocked command result.",
        "The requested watering action did not reach an approved physical output state.",
        "No successful irrigation should be inferred from the blocked result.",
        "Review the activity ledger and resolve every active telemetry, rain, water, relay and pump guard before retrying.",
      ),
    );
  }

  return {
    locked: incidents.length > 0,
    incidents,
  };
}
