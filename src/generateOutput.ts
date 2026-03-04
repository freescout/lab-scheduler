import * as fs from "fs";
import * as path from "path";
import { labData } from "./tests/fixtures/labData";
import { planifyLab } from "./scheduler/planifyLab";

const result = planifyLab(labData);

const output = {
  laboratory: {
    date: "2025-03-15",
    processingDate: "2025-03-15",
    totalSamples: labData.samples.length,
    algorithmVersion: "v1.0",
  },
  schedule: result.schedule,
  metrics: result.metrics,
  metadata: result.metadata,
};

const outputPath = path.join(__dirname, "..", "output-example.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

console.log("output-example.json generated");
console.log(`${result.schedule.length} samples scheduled`);
console.log(`${result.metrics.conflicts} conflicts`);
console.log(`${result.metrics.parallelAnalyses} parallel analyses peak`);
console.log(`Priority respect rate: ${result.metrics.priorityRespectRate}%`);
