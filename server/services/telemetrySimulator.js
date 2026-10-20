import Appliance from '../models/Appliance.js';

let intervalId = null;

/**
 * Calculates a minor wattage fluctuation (±1% to ±3%) around ratedPower.
 * @param {number} basePower - Rated power of the appliance in Watts
 * @returns {number} Fluctuated power value in Watts rounded to 1 decimal place
 */
export const calculateFluctuation = (basePower) => {
  if (!basePower || basePower <= 0) return 0;

  // Variation percentage between 1% (0.01) and 3% (0.03)
  const percent = 0.01 + Math.random() * 0.02;
  const direction = Math.random() < 0.5 ? -1 : 1;
  const fluctuated = basePower * (1 + direction * percent);

  return Math.round(fluctuated * 10) / 10;
};

/**
 * Executes a single telemetry update cycle across active appliances in MongoDB Atlas.
 * Queries active appliances (`status: true`), calculates fluctuated currentPower,
 * updates MongoDB Atlas, and calculates dynamic total load.
 */
export const runTelemetryCycle = async () => {
  try {
    // 1. Query all appliances in MongoDB Atlas with status: true
    const activeAppliances = await Appliance.find({ status: true });

    let totalLoad = 0;

    if (activeAppliances.length > 0) {
      // 2. Apply realistic minor wattage fluctuations (±1% to ±3%) around ratedPower
      const updatePromises = activeAppliances.map(async (appliance) => {
        const basePower = Number(appliance.ratedPower || appliance.powerUsage || 50);

        if (!appliance.ratedPower) {
          appliance.ratedPower = basePower;
        }

        const fluctuatedPower = calculateFluctuation(basePower);
        appliance.currentPower = fluctuatedPower;
        totalLoad += fluctuatedPower;

        return appliance.save();
      });

      await Promise.all(updatePromises);
    }

    // 3. Reset currentPower for inactive appliances (status: false)
    await Appliance.updateMany(
      { status: false, currentPower: { $ne: 0 } },
      { $set: { currentPower: 0 } }
    );

    const formattedKw = (totalLoad / 1000).toFixed(2);
    console.log(
      `[TelemetrySimulator] ⚡ Sensor Telemetry Updated | Active Devices: ${activeAppliances.length} | Dynamic Total Load: ${Math.round(totalLoad)} W (${formattedKw} kW)`
    );

    return {
      activeCount: activeAppliances.length,
      totalLoadWatts: Math.round(totalLoad),
      totalLoadKw: formattedKw,
    };
  } catch (error) {
    console.error('[TelemetrySimulator] Error running telemetry cycle:', error.message);
  }
};

/**
 * Starts the telemetry simulator background interval service (runs every 4 seconds).
 * @param {number} [intervalMs=4000] - Interval duration in milliseconds
 */
export const startTelemetrySimulator = (intervalMs = 4000) => {
  if (intervalId) {
    console.log('[TelemetrySimulator] Service is already active.');
    return;
  }

  console.log(`[TelemetrySimulator] 🚀 Real-time Telemetry Simulator Service started (Interval: ${intervalMs / 1000}s)`);

  // Run initial cycle immediately
  runTelemetryCycle();

  // Schedule recurring interval every 4 seconds
  intervalId = setInterval(() => {
    runTelemetryCycle();
  }, intervalMs);
};

/**
 * Stops the telemetry simulator background interval service.
 */
export const stopTelemetrySimulator = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[TelemetrySimulator] Service stopped.');
  }
};

export default {
  startTelemetrySimulator,
  stopTelemetrySimulator,
  runTelemetryCycle,
  calculateFluctuation,
};
