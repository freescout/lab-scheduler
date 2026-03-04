import { labData } from "./tests/fixtures/labData";
import { planifyLab } from "./scheduler/planifyLab";

// ==============================
// Run Intermediate Scheduler
// ==============================
console.log("===== Laboratoire Central Médical =====");
console.log(`Samples   : ${labData.samples.length}`);
console.log(`Technicians: ${labData.technicians.length}`);
console.log(`Equipment  : ${labData.equipment.length}`);
console.log("=======================================\n");

const result = planifyLab(labData);

// ── Schedule ──────────────────────────────────────────────────────────────────
console.log("===== Schedule =====");
for (const entry of result.schedule) {
  console.log(
    `[${entry.priority.padEnd(7)}] ${entry.sampleId} | ` +
      `${entry.startTime}-${entry.endTime} | ` +
      `Tech: ${entry.technicianId} | ` +
      `Equip: ${entry.equipmentId} | ` +
      `${entry.analysisType ?? ""}`,
  );
}

// ── Metrics ───────────────────────────────────────────────────────────────────
console.log("\n===== Metrics =====");
console.log(JSON.stringify(result.metrics, null, 2));

// ── Unscheduled ───────────────────────────────────────────────────────────────
if (result.metrics.conflicts > 0) {
  console.log(
    `\n⚠️  ${result.metrics.conflicts} sample(s) could not be scheduled`,
  );
}
