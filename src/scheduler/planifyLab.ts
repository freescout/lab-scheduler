import {
  Equipment,
  LabData,
  Metrics,
  PlanifyResult,
  Priority,
  Sample,
  ScheduleEntry,
  Technician,
} from "../models/types";
import { toHHMM, toMinutes } from "../utils/time";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  STAT: 0,
  URGENT: 1,
  ROUTINE: 2,
};

function sortSamples(samples: Sample[]): Sample[] {
  return [...samples].sort((a, b) => {
    const byPriority =
      PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (byPriority !== 0) return byPriority;

    return toMinutes(a.arrivalTime) - toMinutes(b.arrivalTime);
  });
}

function isTechnicianCompatible(
  technician: Technician,
  sample: Sample,
): boolean {
  return (
    technician.speciality === sample.type || technician.speciality === "GENERAL"
  );
}

function isEquipmentCompatible(equipment: Equipment, sample: Sample): boolean {
  return equipment.type === sample.type;
}

export function planifyLab(data: LabData): PlanifyResult {
  const { samples, technicians, equipment } = data;

  // 1. Sort samples by priority and arrival time

  const sortedSamples = sortSamples(samples);

  // 2. Initialize technician availability tracking

  const technicianAvailableAt = new Map<string, number>();
  for (const technician of technicians) {
    technicianAvailableAt.set(technician.id, toMinutes(technician.startTime));
  }

  // 3. Initialize equipment availability tracking

  const equipmentAvailableAt = new Map<string, number>();
  for (const equip of equipment) {
    equipmentAvailableAt.set(
      equip.id,
      equip.available ? 0 : Number.POSITIVE_INFINITY,
    );
  }

  //Iterate over samples and assign resources
  const schedule: ScheduleEntry[] = [];

  for (const sample of sortedSamples) {
    let bestStartTime: number | null = null;
    let selectedTechnicianId: string | null = null;
    let selectedEquipmentId: string | null = null;

    const sampleArrival = toMinutes(sample.arrivalTime);

    for (const technician of technicians) {
      if (!isTechnicianCompatible(technician, sample)) continue;

      for (const equip of equipment) {
        if (!isEquipmentCompatible(equip, sample)) continue;

        const technicianStart = toMinutes(technician.startTime);
        const technicianEnd = toMinutes(technician.endTime);

        const technicianAvailable = technicianAvailableAt.get(technician.id)!;
        const equipmentAvailable = equipmentAvailableAt.get(equip.id)!;

        const candidateStart = Math.max(
          sampleArrival,
          technicianAvailable,
          equipmentAvailable,
          technicianStart,
        );

        const candidateEnd = candidateStart + sample.analysisTime;

        if (candidateEnd > technicianEnd) continue;

        if (bestStartTime === null || candidateStart < bestStartTime) {
          bestStartTime = candidateStart;
          selectedTechnicianId = technician.id;
          selectedEquipmentId = equip.id;
        }
      }
    }

    if (bestStartTime !== null && selectedTechnicianId && selectedEquipmentId) {
      const endTime = bestStartTime + sample.analysisTime;

      technicianAvailableAt.set(selectedTechnicianId, endTime);
      equipmentAvailableAt.set(selectedEquipmentId, endTime);

      schedule.push({
        sampleId: sample.id,
        technicianId: selectedTechnicianId,
        equipmentId: selectedEquipmentId,
        startTime: toHHMM(bestStartTime),
        endTime: toHHMM(endTime),
        priority: sample.priority,
      });
    }
  }

  // 5. Compute metrics

  let totalTime = 0;
  let efficiency = 0;

  if (schedule.length > 0) {
    const totalAnalysisTime = schedule.reduce((sum, entry) => {
      return sum + (toMinutes(entry.endTime) - toMinutes(entry.startTime));
    }, 0);

    const allStartTimes = schedule.map((e) => toMinutes(e.startTime));
    const allEndTimes = schedule.map((e) => toMinutes(e.endTime));

    const firstStart = Math.min(...allStartTimes);
    const lastEnd = Math.max(...allEndTimes);

    totalTime = lastEnd - firstStart;
    efficiency = totalTime > 0 ? (totalAnalysisTime / totalTime) * 100 : 0;
  }

  const conflicts = sortedSamples.length - schedule.length;

  const metrics: Metrics = {
    totalTime,
    efficiency: Math.round(efficiency * 10) / 10,
    conflicts,
  };

  // 6. Return final result

  return {
    schedule,
    metrics,
  };
}
