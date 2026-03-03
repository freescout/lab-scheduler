import { LabData, PlanifyResult, Priority, Sample } from "../models/types";
import { toMinutes } from "../utils/time";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  STAT: 0,
  URGENT: 1,
  ROUTINE: 2,
};

// step 1:
function sortSamples(samples: Sample[]): Sample[] {
  return [...samples].sort((a, b) => {
    const byPriority =
      PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (byPriority !== 0) return byPriority;

    return toMinutes(a.arrivalTime) - toMinutes(b.arrivalTime);
  });
}

export function planifyLab(data: LabData): PlanifyResult {
  const { samples, technicians, equipment } = data;
  // 1. Sort samples by priority and arrival time
  const sortedSamples = sortSamples(samples);
  console.log(sortedSamples.map((s) => s.id));
  // 2. Initialize technician availability tracking
  // 3. Initialize equipment availability tracking
  // 4. Iterate over samples and assign resources
  // 5. Compute metrics
  // 6. Return final result
  return {
    schedule: [],
    metrics: {
      totalTime: 0,
      efficiency: 0,
      conflicts: 0,
    },
  };
}
